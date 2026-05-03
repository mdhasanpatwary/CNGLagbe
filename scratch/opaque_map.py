from PIL import Image

logo_path = 'public/logo.png'
img = Image.open(logo_path).convert("RGBA")
pixels = img.load()

new_img = Image.new("L", img.size)
new_pixels = new_img.load()

for y in range(img.height):
    for x in range(img.width):
        r, g, b, a = pixels[x, y]
        if a > 0:
            new_pixels[x, y] = 255
        else:
            new_pixels[x, y] = 0

new_img.save('scratch/opaque_map.png')
print("Saved scratch/opaque_map.png")
