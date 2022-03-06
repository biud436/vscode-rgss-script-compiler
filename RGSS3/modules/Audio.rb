module Audio
    module_function

    def setup_midi; end

    def bgm_play(filename, volume = 100, pitch = 100, pos = 0)
        1
    end

    def bgm_stop; end

    def bgm_fade(time); end

    def bgm_pos
        0 # Incapable of integration at the time
    end

    def bgs_play(filename, volume = 100, pitch = 100, pos = 0)
        1
    end

    def bgs_stop
        @bgs.stop if @bgs
    end

    def bgs_fade(time); end

    def bgs_pos
        0
    end

    def me_play(filename, volume = 100, pitch = 100)
        1
    end

    def me_stop; end

    def me_fade(time); end

    def se_play(filename, volume = 100, pitch = 100)
        1
    end

    def se_stop; end
end
