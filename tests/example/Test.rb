class Test
    def initialize
      @name = "hello"
    end
    def name
      @name
    end
end

File.open("test.dump", "w") do |f|
    f.write(Marshal.dump(Test.new))
end