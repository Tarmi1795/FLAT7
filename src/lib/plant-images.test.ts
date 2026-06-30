import { describe, expect, it } from "vitest";
import { optimizePlantPhoto } from "@/lib/plant-images";

describe("optimizePlantPhoto", () => {
  it("rejects non-image files before processing", async () => {
    const file = new File(["not a photo"], "notes.txt", { type: "text/plain" });
    await expect(optimizePlantPhoto(file)).rejects.toThrow("Choose an image file.");
  });

  it("rejects source images larger than 20 MB", async () => {
    const file = new File([new Uint8Array(20 * 1024 * 1024 + 1)], "huge.jpg", { type: "image/jpeg" });
    await expect(optimizePlantPhoto(file)).rejects.toThrow("Photo must be smaller than 20 MB.");
  });
});
