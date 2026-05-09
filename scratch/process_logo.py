from PIL import Image, ImageEnhance, ImageOps
import numpy as np

def process_logo():
    input_path = "/Users/patwary/Projects/CNGLagbe/public/logo.png"
    img = Image.open(input_path).convert("RGBA")
    data = np.array(img)
    
    # Extract channels
    r, g, b, a = data[:,:,0], data[:,:,1], data[:,:,2], data[:,:,3]
    
    # 1. Create a White version for Dark/Primary Backgrounds
    # Turn everything that has opacity into white, keep opacity
    white_data = data.copy()
    white_data[:,:,0] = 255
    white_data[:,:,1] = 255
    white_data[:,:,2] = 255
    white_img = Image.fromarray(white_data)
    white_img.save("/Users/patwary/Projects/CNGLagbe/public/logo_white.png")
    
    # 2. Create a version for Light Backgrounds (Fix white slogan)
    # The slogan is very light/white. We can detect highly luminous pixels
    # and turn them into a dark grey.
    light_bg_data = data.copy()
    
    # Calculate luminance
    lum = 0.299 * r + 0.587 * g + 0.114 * b
    
    # Mask for white/very light pixels (like the slogan)
    # Exclude transparent pixels
    mask = (lum > 220) & (a > 50)
    
    # Turn those white pixels to a dark grey (e.g., #475569)
    light_bg_data[mask, 0] = 71
    light_bg_data[mask, 1] = 85
    light_bg_data[mask, 2] = 105
    
    light_img = Image.fromarray(light_bg_data)
    light_img.save("/Users/patwary/Projects/CNGLagbe/public/logo_dark_text.png")
    print("Logos processed and saved.")

if __name__ == "__main__":
    process_logo()
