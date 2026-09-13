from pathlib import Path
from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
BACKGROUND = "#263b2f"
ACCENT = "#d8ff53"


def font(size: int) -> ImageFont.FreeTypeFont:
    candidates = [
        Path("C:/Windows/Fonts/seguisb.ttf"),
        Path("C:/Windows/Fonts/arialbd.ttf"),
        Path("/System/Library/Fonts/SFNS.ttf"),
        Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"),
    ]
    for candidate in candidates:
        if candidate.exists():
            return ImageFont.truetype(str(candidate), size)
    return ImageFont.load_default(size=size)


def base_icon(maskable: bool = False) -> Image.Image:
    image = Image.new("RGB", (512, 512), BACKGROUND)
    draw = ImageDraw.Draw(image)
    inset = 116 if maskable else 98
    radius = 80 if maskable else 94
    draw.rounded_rectangle((inset, inset, 512 - inset, 512 - inset), radius=radius, fill=ACCENT)
    typeface = font(210 if not maskable else 180)
    bounds = draw.textbbox((0, 0), "R", font=typeface)
    width = bounds[2] - bounds[0]
    height = bounds[3] - bounds[1]
    draw.text(((512 - width) / 2, (512 - height) / 2 - bounds[1] - 5), "R", font=typeface, fill=BACKGROUND)
    return image


def save_resized(image: Image.Image, name: str, size: int) -> None:
    image.resize((size, size), Image.Resampling.LANCZOS).save(PUBLIC / name, optimize=True)


PUBLIC.mkdir(parents=True, exist_ok=True)
regular = base_icon()
save_resized(regular, "pwa-512x512.png", 512)
save_resized(regular, "pwa-192x192.png", 192)
save_resized(regular, "apple-touch-icon.png", 180)
save_resized(base_icon(maskable=True), "pwa-maskable-512x512.png", 512)
print("Ícones gerados em", PUBLIC)

