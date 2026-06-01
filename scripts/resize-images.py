import os
from PIL import Image

def resize_images_in_dir(directory, max_size=512, exclude_suffixes=None):
    if exclude_suffixes is None:
        exclude_suffixes = []
    
    if not os.path.exists(directory):
        print(f"Directory {directory} does not exist.")
        return
        
    print(f"\nResizing images in {directory} (max size: {max_size}px)...")
    for filename in os.listdir(directory):
        if not filename.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')):
            continue
            
        # Check exclusions
        should_exclude = False
        for suffix in exclude_suffixes:
            if filename.lower().endswith(suffix.lower()):
                should_exclude = True
                break
        if should_exclude:
            continue
            
        file_path = os.path.join(directory, filename)
        try:
            with Image.open(file_path) as img:
                orig_width, orig_height = img.size
                # Skip if already smaller than max_size in both dimensions
                if orig_width <= max_size and orig_height <= max_size:
                    print(f"  - {filename} is already small ({orig_width}x{orig_height}), skipping.")
                    continue
                    
                # Calculate new size maintaining aspect ratio
                if orig_width > orig_height:
                    new_width = max_size
                    new_height = int(orig_height * (max_size / orig_width))
                else:
                    new_height = max_size
                    new_width = int(orig_width * (max_size / orig_height))
                    
                # Resize using Lanczos interpolation
                try:
                    resample_filter = Image.Resampling.LANCZOS
                except AttributeError:
                    resample_filter = Image.LANCZOS
                    
                resized_img = img.resize((new_width, new_height), resample_filter)
                
                # Save overwriting the original file with optimization
                resized_img.save(file_path, optimize=True)
                print(f"  -> Resized {filename} from {orig_width}x{orig_height} to {new_width}x{new_height}")
        except Exception as e:
            print(f"  Error processing {filename}: {e}")

if __name__ == "__main__":
    # Resize backgrounds
    resize_images_in_dir('public/assets/images/backgrounds', max_size=512)
    # Resize class background images (exclude avatars)
    resize_images_in_dir('public/assets/images/classes', max_size=512, exclude_suffixes=['_avatar.png'])
    # Resize race background images (exclude avatars and the spritesheet)
    resize_images_in_dir('public/assets/images/races', max_size=512, exclude_suffixes=['_avatar.png', 'miniaturas.png'])
    
    # Resize new main backgrounds to 800px to optimize performance on load
    for bg_file in ['public/assets/images/login_bg.png', 'public/assets/images/landing_bg.png']:
        if os.path.exists(bg_file):
            print(f"\nResizing specific background: {bg_file}...")
            try:
                with Image.open(bg_file) as img:
                    orig_width, orig_height = img.size
                    new_width, new_height = 800, 800
                    try:
                        resample_filter = Image.Resampling.LANCZOS
                    except AttributeError:
                        resample_filter = Image.LANCZOS
                    resized_img = img.resize((new_width, new_height), resample_filter)
                    resized_img.save(bg_file, optimize=True)
                    print(f"  -> Resized {bg_file} to {new_width}x{new_height} and optimized.")
            except Exception as e:
                print(f"  Error processing {bg_file}: {e}")

