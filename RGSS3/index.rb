#!/bin/ruby
require_relative './modules/Audio.rb'
require_relative './modules/Table.rb'
require_relative './modules/RPG.rb'
require_relative './plugins/rxscript.rb'
require 'optparse'
require 'zlib'

raise 'Ruby 1.9.2 or later is required.' if RUBY_VERSION <= '1.9.1'

##
# +Entrypoint+
# Entry point for the application.
#
module EntryPoint
  ##
  # +App+
  # This class allows you to handle by passing the arguments to the application.
  class App
    ##
    # Initialize the application.
    def initialize
      options = { compress: false }
      OptionParser
        .new do |opts|
          opts.banner = 'Usage: rvdata2 [options]'
          opts.on(
            '-o',
            '--output OUTPUT',
            'Sets the VSCode Workspace Directory',
          ) { |v| options[:output] = v }
          opts.on(
            '-i',
            '--input INPUT',
            'Sets the script file ends with named rvdata2',
          ) { |v| options[:input] = v }
          opts.on(
            '-c',
            '--compress',
            'Compress script files to Scripts.rvdata2',
          ) { |v| options[:compress] = v }
          opts.on('-h', '--help', 'Prints the help documentaion') do
            puts opts
            exit
          end
        end
        .parse!(ARGV)

      if !options[:output] || !options[:input]
        raise 'Please specify the VSCode Workspace Directory and the script file ends with named rvdata2.'
      end

      @vscode_workspace = options[:output]
      @scripts_file = options[:input]
      @compress = options[:compress]
    end

    ##
    # 스크립트 파일을 내보냅니다.
    #
    def start
      if @compress
        compress_script(@vscode_workspace, @scripts_file)
      else
        extract_script(@vscode_workspace, @scripts_file)
      end
    end

    def is_windows?
      return RUBY_PLATFORM =~ /mswin(?!ce)|mingw|cygwin|bccwin/
    end

    def is_mac?
      return RUBY_PLATFORM =~ /darwin/
    end

    private

    ##
    # Extracts Script file.
    #
    # @param [String] vscode_workspace
    # @param [String] scripts_file
    # @return [void]
    def extract_script(vscode_workspace, scripts_file)
      begin
        root_folder = @vscode_workspace
        extract_folder = File.join(root_folder, 'Scripts').gsub('\\', '/')

        Dir.mkdir(extract_folder) if !File.exist?(extract_folder)

        RXDATA.ExtractScript(extract_folder, @scripts_file)
      rescue => e
        puts e
      end
    end

    ##
    # Compress Script file.
    #
    # @param [String] vscode_workspace
    # @param [String] scripts_file
    # @return [void]
    def compress_script(vscode_workspace, scripts_file)
      begin
        root_folder = @vscode_workspace
        extract_folder = File.join(root_folder, 'Scripts').gsub('\\', '/')

        Dir.mkdir(extract_folder) if !File.exist?(extract_folder)

        RXDATA.CompressScript(extract_folder, @scripts_file)
      rescue => e
        puts e
      end
    end
  end
end

$main = EntryPoint::App.new
$main.start
