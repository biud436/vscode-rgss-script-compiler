import { dump, load } from "@hyrious/marshal";

describe("dump", () => {
    it("dump(null)", () => {
        const result = new Uint8Array([4, 8, 48]);

        expect(dump(null)).toEqual(result);
    });

    it('load("\x04\b0")', () => {
        const result = new Uint8Array([4, 8, 48]);

        expect(load(result)).toEqual(null);
    });

    it("echo 테스트", () => {
        // class Test
        //   def initialize
        //     @name = "hello"
        //   end

        //   def name
        //     @name
        //   end
        // end
        const serialized = `\x04\bo:\tTest\x06:\n@nameI\"\nhello\x06:\x06ET`;

        // Marshal.dump(test).unpack("U*")
        expect(dump(load(serialized))).toEqual(
            new Uint8Array([
                4, 8, 111, 58, 9, 84, 101, 115, 116, 6, 58, 10, 64, 110, 97,
                109, 101, 73, 34, 10, 104, 101, 108, 108, 111, 6, 58, 6, 69, 84,
            ]),
        );
    });
});
