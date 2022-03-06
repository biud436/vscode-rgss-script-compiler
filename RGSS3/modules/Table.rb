## ========================================
## Original Source
## https://github.com/CaptainJet/RM-Gosu
## ========================================
class Table
    attr_accessor :xsize, :ysize, :zsize, :data

    def initialize(x, y = 0, z = 0)
        @dim = 1 + (y > 0 ? 1 : 0) + (z > 0 ? 1 : 0)
        @xsize, @ysize, @zsize = x, [y, 1].max, [z, 1].max
        @data = Array.new(x * y * z, 0)
    end

    def [](x, y = 0, z = 0)
        @data[x + y * @xsize + z * @xsize * @ysize]
    end

    def resize(x, y = nil, z = nil)
        @dim = 1 + ((y || @ysize) > 0 ? 1 : 0) + ((z || @zsize) > 0 ? 1 : 0)
        @xsize, @ysize, @zsize = x, [y || @ysize, 1].max, [z || @zsize, 1].max
        @data = @data[0, @xsize * @ysize * @zsize - 1]
        @data << 0 until @data.size == @xsize * @ysize * @zsize
    end

    def []=(*args)
        x = args[0]
        y = args.size > 2 ? args[1] : 0
        z = args.size > 3 ? args[2] : 0
        v = args.pop
        @data[x + y * @xsize + z * @xsize * @ysize] = v
    end

    def _dump(d = 0)
        s =
            [@dim, @xsize, @ysize, @zsize, @xsize * @ysize * @zsize].pack(
                'LLLLL',
            )
        a = []
        ta = []
        @data.each do |d|
            if d.is_a?(Fixnum) && (d < 32_768 && d >= 0)
                s << [d].pack('S')
            else
                s << [ta].pack("S#{ta.size}")
                ni = a.size
                a << d
                s << [0x8000 | ni].pack('S')
            end
        end
        s << Marshal.dump(a) if a.size > 0
        s
    end

    def self._load(s)
        size, nx, ny, nz, items = *s[0, 20].unpack('LLLLL')
        t = Table.new(*[nx, ny, nz][0, size])
        d = s[20, items * 2].unpack("S#{items}")
        if s.length > (20 + items * 2)
            a = Marshal.load(s[(20 + items * 2)...s.length])
            d.collect! { |i| i & 0x8000 == 0x8000 ? a[i & ~0x8000] : i }
        end
        t.data = d
        t
    end
end
