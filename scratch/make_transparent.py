from PIL import Image

def make_transparent(input_path, output_path, bg_color):
    img = Image.open(input_path).convert("RGBA")
    datas = img.getdata()

    newData = []
    # Tolerance for background removal
    tolerance = 30
    
    for item in datas:
        # Check if pixel is close to background color
        if abs(item[0] - bg_color[0]) < tolerance and \
           abs(item[1] - bg_color[1]) < tolerance and \
           abs(item[2] - bg_color[2]) < tolerance:
            # Make it transparent
            newData.append((255, 255, 255, 0))
        else:
            newData.append(item)

    img.putdata(newData)
    img.save(output_path, "PNG")

make_transparent(
    "/Users/patwary/.gemini/antigravity/brain/363d8409-3e23-4aab-aaa5-f248070b52fd/logo_white_1778326179063.png", 
    "/Users/patwary/Projects/CNGLagbe/public/logo_white.png", 
    (0, 0, 0)
)
make_transparent(
    "/Users/patwary/.gemini/antigravity/brain/363d8409-3e23-4aab-aaa5-f248070b52fd/logo_dark_text_1778326208486.png", 
    "/Users/patwary/Projects/CNGLagbe/public/logo_dark_text.png", 
    (255, 255, 255)
)
