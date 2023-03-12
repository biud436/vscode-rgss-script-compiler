#==============================================================================
# ** rxscript io (1.0)
#------------------------------------------------------------------------------
#  Original Author   : Korokke (gksdntjr714@naver.com)
#  Created  : 2019-02-10
#  Latest   : 2019-02-10
#  Original Source : https://cafe.naver.com/xpcafe/172565
#  Example :
#   begin
#      RXDATA.ExtractScript("Extracted", "Data\\Scripts.rxdata")
#      RXDATA.CompressScript("Extracted", "Data\\test.rxdata")
#      RXDATA.ExtractScript("Extracted-test", "Data\\test.rxdata")
#   end
#------------------------------------------------------------------------------
# Modified by : Jinseok Eo
#==============================================================================

require 'securerandom'
require 'json'

module UUID
    def self.v4
        SecureRandom.uuid
    end
end

class ScriptIdentifier
    attr_reader :uuid, :name, :index

    def initialize(index, name)
        @uuid = UUID.v4
        @name = name
        @index = index
    end

    def to_s
        { uuid: @uuid, name: @name, index: @index }.to_json
    end
end

module RXDATA
    @@usedSections = []

    module_function

    def GetRandomSection
        begin
            section = rand(2_147_483_647)
        end while @@usedSections.include?(section)
        @@usedSections.push(section)
        return section
    end

    def ZlibInflate(str)
        zstream = ::Zlib::Inflate.new
        buf = zstream.inflate(str)
        zstream.finish
        zstream.close
        return buf
    end

    def ZlibDeflate(str)
        z = ::Zlib::Deflate.new(::Zlib::BEST_COMPRESSION)
        dst = z.deflate(str, ::Zlib::FINISH)
        z.close
        return dst
    end

    class Script
        attr_reader :section
        attr_reader :title
        attr_reader :text

        def initialize(section, title, text)
            @section = section
            @title = title.to_s
            @text = RXDATA.ZlibInflate(text)
        end

        def rmscript
            return @section, @title, RXDATA.ZlibDeflate(@text)
        end
    end

    def ExtractScript(outdir, rxdata)
        return unless File.exist? rxdata
        Dir.mkdir(outdir) unless File.exist? outdir

        input = File.open(rxdata, 'rb')
        scripts = Marshal.load(input.read)
        info = ''

        # ScriptIdentifier[]
        script_identifier = {}
        script_index = 0

        for script in scripts
            if script.length == 1
                tmp = script[0]
                tmp[0] = RXDATA.GetRandomSection
                data = Script.new(tmp[0], tmp[1], tmp[2])
            elsif script.length == 2
                data = Script.new(RXDATA.GetRandomSection, script[0], script[1])
            elsif script.length == 3
                data = Script.new(RXDATA.GetRandomSection, script[1], script[2])
            end

            identifier = ScriptIdentifier.new(script_index, data.title)
            script_identifier[identifier.uuid] = identifier

            title = data.title
            title = "Untitled_#{script_index}" if title.empty?

            filename = title + '.rb'
            info += filename + "\n"
            output = File.new(File.join(outdir, filename), 'wb')
            output.write(data.text) # "\n"을 replace 하는 코드 제거
            output.close

            script_index += 1
        end

        # txt
        output = File.new(File.join(outdir, 'info.txt'), 'wb')
        output.write(info)
        output.close

        input.close
    end

    def CompressScript(indir, rxdata)
        return unless File.exist? indir

        files = []
        if File.exist? File.join(indir, 'info.txt')
            input = File.open(File.join(indir, 'info.txt'), 'rb')
            input.read.each_line do |line|
                filename = line.gsub("\n", '')
                files.push(File.join(indir, filename))
            end
            input.close
        else
            files = Dir.glob(File.join(indir, '*.rb'))
        end

        scripts = []
        for rb in files
            input = File.open(rb, 'r')
            section = RXDATA.GetRandomSection
            title = File.basename(rb, '.rb')
            title = '' if title =~ /^(?:Untitled)\_[\d]+$/
            text = input.read
            text = text.force_encoding('utf-8')
            text = RXDATA.ZlibDeflate(text)
            scripts.push([section, title, text])
            input.close
        end
        save = Marshal.dump(scripts)

        output = File.new(rxdata, 'wb+')
        output.write(save)
        output.close
    end
end
