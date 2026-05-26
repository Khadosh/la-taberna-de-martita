import os
from PIL import Image

def crop_spritesheet(img_path, out_dir, row1_names, row2_names):
    """
    Recorta un spritesheet de dos filas.
    - La primera fila se divide en partes iguales según la cantidad de nombres en row1_names.
    - La segunda fila se divide en partes iguales según la cantidad de nombres en row2_names.
    """
    if not os.path.exists(img_path):
        print(f"Error: No se encontró el archivo en {img_path}")
        return

    os.makedirs(out_dir, exist_ok=True)
    img = Image.open(img_path)
    width, height = img.size
    row_height = height // 2

    print(f"Dimensiones del Spritesheet: {width}x{height}")
    print(f"Alto de cada fila: {row_height}px")

    # Fila 1
    col_width_r1 = width // len(row1_names)
    print(f"Fila 1 (ancho columna: {col_width_r1}px):")
    for i, name in enumerate(row1_names):
        left = i * col_width_r1
        top = 0
        right = (i + 1) * col_width_r1
        bottom = row_height
        
        avatar = img.crop((left, top, right, bottom))
        out_path = os.path.join(out_dir, f"{name}_avatar.png")
        avatar.save(out_path)
        print(f"  -> Guardado {out_path}")

    # Fila 2
    col_width_r2 = width / len(row2_names)
    print(f"Fila 2 (ancho columna: {col_width_r2:.2f}px):")
    for i, name in enumerate(row2_names):
        left = int(i * col_width_r2)
        top = row_height
        right = int((i + 1) * col_width_r2)
        bottom = height
        
        avatar = img.crop((left, top, right, bottom))
        out_path = os.path.join(out_dir, f"{name}_avatar.png")
        avatar.save(out_path)
        print(f"  -> Guardado {out_path}")

if __name__ == "__main__":
    # Configuración por defecto para las razas
    IMG_PATH = 'public/assets/images/races/miniaturas.png'
    OUT_DIR = 'public/assets/images/races'
    
    RACES_ROW1 = ['dragonborn', 'dwarf', 'elf', 'gnome']
    RACES_ROW2 = ['half-elf', 'half-orc', 'halfling', 'human', 'tiefling']
    
    crop_spritesheet(IMG_PATH, OUT_DIR, RACES_ROW1, RACES_ROW2)
