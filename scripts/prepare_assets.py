"""Prepare local portrait, résumé, and social preview. Requires Pillow."""

import argparse
import shutil
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("portrait", type=Path)
parser.add_argument("resume", type=Path)
args = parser.parse_args()
root = Path(__file__).resolve().parents[1]
images = root / "assets/images"
documents = root / "assets/documents"
documents.mkdir(exist_ok=True)
with Image.open(args.portrait) as original:
    portrait = ImageOps.fit(ImageOps.exif_transpose(original).convert("RGB"), (640, 640))
    portrait.save(images / "danilo.webp", quality=86, method=6)
shutil.copyfile(args.resume, documents / "Danilo-Santos-Resume.pdf")

card = Image.new("RGB", (1200, 630), "#282a36")
draw = ImageDraw.Draw(card)
font_dir = Path("/usr/share/fonts/truetype/dejavu")
regular = lambda size: ImageFont.truetype(str(font_dir / "DejaVuSans.ttf"), size)
bold = lambda size: ImageFont.truetype(str(font_dir / "DejaVuSans-Bold.ttf"), size)
mono = lambda size: ImageFont.truetype(str(font_dir / "DejaVuSansMono.ttf"), size)
draw.rounded_rectangle((38, 38, 1162, 592), radius=24, outline="#555165", width=2)
draw.rounded_rectangle((80, 78, 128, 126), radius=12, outline="#756185", width=2)
draw.text((89, 79), "d.", font=bold(28), fill="#bd93f9")
draw.text((150, 88), "DANILO SANTOS", font=mono(18), fill="#f8f8f2")
draw.text((80, 193), "Good ideas deserve", font=bold(42), fill="#f8f8f2")
draw.text((80, 251), "great engineering.", font=bold(45), fill="#bd93f9")
draw.text((83, 354), "Full-Stack Engineer", font=regular(25), fill="#bec0d0")
draw.text((83, 401), "Angular / React / TypeScript", font=mono(17), fill="#8be9fd")
draw.text((83, 520), "santosdanilo.github.io", font=mono(18), fill="#bec0d0")
photo = ImageOps.fit(portrait, (340, 390), method=Image.Resampling.LANCZOS)
mask = Image.new("L", photo.size)
ImageDraw.Draw(mask).rounded_rectangle((0, 0, 339, 389), radius=18, fill=255)
card.paste(photo, (776, 121), mask)
draw.rounded_rectangle((775, 120, 1117, 512), radius=18, outline="#bd93f9", width=2)
card.save(images / "social-card.png", optimize=True)
print("Prepared optimized portrait, social preview, and résumé.")
