const imageStyles = {
    "Hội họa Cổ điển & Truyền thống": {
        "Van Gogh / Rembrandt": "masterpiece oil painting, thick impasto brushstrokes, dramatic lighting, style of Van Gogh and Rembrandt.",
        "Baroque (Ba Rốc)": "Baroque period painting, style of Caravaggio, dramatic chiaroscuro lighting, intense emotion, ornate details.",
        "Tranh Thủy Mặc Trung Hoa": "Chinese traditional ink wash painting (Shanshui), minimalist, delicate brush strokes, vast negative space.",
        "Ukiyo-e Nhật Bản": "Japanese ukiyo-e woodblock print, style of Hokusai, bold outlines, flat areas of color.",
        "Tranh chấm Úc": "Aboriginal dot art, intricate dot patterns, earthy color palette, traditional Australian patterns.",
        "Tranh dân gian Việt Nam (Đông Hồ)": "Vietnamese Dong Ho folk woodcut print, bold simple outlines, natural colors from leaves and shells on Dó paper, themes of rural life and prosperity.",
        "Tranh dân gian Thế giới (Alebrije)": "Vibrant Mexican Alebrije folk art style, fantastical creatures, intricate psychedelic patterns, extremely bright and saturated colors."
    },
    "Hiện đại & Đương đại": {
        "Art Deco": "Art Deco illustration, geometric patterns, bold lines, luxurious gold and black, symmetrical design.",
        "Cubism (Lập thể)": "Cubism, style of Picasso, geometric abstraction, fragmented objects, multiple viewpoints.",
        "Surrealism (Siêu thực)": "Surrealism, style of Salvador Dalí, dreamlike and bizarre subconscious imagery, melting objects.",
        "Pop Art": "Pop Art, style of Andy Warhol, bold vibrant colors, comic book style, Ben-Day dots.",
        "Street Art / Graffiti": "Street art, graffiti style, stencil art, spray paint on a brick wall, style of Banksy.",
        "Tranh Tối giản (Minimalism)": "Minimalism, extreme simplicity, geometric shapes, limited color palette, clean lines, large areas of negative space, focus on pure form.",
        "Tranh Trừu tượng (Abstract)": "Abstract expressionism, style of Jackson Pollock, dynamic splatters and drips of paint, non-representational, focus on energy and emotion.",
        "Tranh Phong cảnh (Trường phái Sông Hudson)": "Hudson River School landscape painting, style of Albert Bierstadt, romantic and epic vistas, dramatic lighting with glowing sunbeams, detailed and idealized nature."
    },
    "Hoạt hình, Điện ảnh & Kỹ thuật số": {
        "Studio Ghibli": "Anime aesthetic, style of Studio Ghibli, whimsical, heartwarming, detailed hand-painted watercolor backgrounds.",
        "Pixar / Disney 3D": "Modern 3D animation, cinematic lighting, vibrant color palette, expressive character design.",
        "Film Noir": "Black and white film noir scene, 1940s detective movie aesthetic, dramatic high-contrast lighting, deep shadows.",
        "Cyberpunk": "Cyberpunk cityscape at night, neon-drenched, Blade Runner aesthetic, holographic advertisements.",
        "Tranh 3D Kỹ thuật số": "Digital 3D painting, ZBrush sculpt with painterly textures, dramatic lighting, hyper-realistic details combined with artistic brushstrokes, cinematic feel."
    },
    "Hoạt hình 2D & Stop Motion": {
        "Hoạt hình Cartoon (Thập niên 90)": "90s cartoon style, bold outlines, vibrant flat colors, cel-shaded, reminiscent of classic Saturday morning cartoons.",
        "Hoạt hình Người que (Stick Figure)": "Minimalist stick figure animation, clean white background, dynamic poses, expressive simple lines, fluid motion.",
        "Đồ họa chuyển động (Motion Graphics)": "Clean motion graphics style, 2D vector illustration, corporate explainer video aesthetic, simple characters, bold infographics, isometric design.",
        "Hoạt hình Phác thảo (Sketch)": "Hand-drawn charcoal sketch animation, rough expressive lines, smudged shading, paper texture, black and white, constant flickering effect.",
        "Hoạt hình Màu nước (Watercolor)": "Flowing watercolor animation, bleeding and blooming colors, visible paper texture, soft edges, dreamlike and organic transitions.",
        "Hoạt hình Cắt giấy (Paper Cutout)": "Paper cutout stop motion animation, layered construction paper, tangible shadows, whimsical and handcrafted feel, style of South Park.",
        "Hoạt hình Đất sét (Claymation)": "Claymation stop motion, visible fingerprints on plasticine characters, handcrafted sets, style of Aardman Animations (Wallace and Gromit).",
        "Hoạt hình Chất lỏng (Liquid Animation)": "Psychedelic liquid light show animation, morphing and flowing abstract shapes, vibrant swirling colors, retro 1960s aesthetic.",
        "Nghệ thuật Cát (Sand Art)": "Sand art animation, ephemeral images drawn in sand on a light table, high contrast, flowing and morphing shapes, monochromatic tones."
    }
};

const videoStyles = {
    "Điện ảnh Kịch tính": {
        "Hollywood Sử thi": "epic cinematic shot, dramatic lighting, wide-angle lens, slow-motion, blockbuster feel, style of Christopher Nolan.",
        "Film Noir": "black and white film noir, high-contrast lighting, deep shadows, low-angle shots, mystery, 1940s aesthetic.",
        "Điện ảnh Tối giản (Slow Cinema)": "long take, static camera, minimalist composition, natural lighting, focus on atmosphere and subtlety, style of Andrei Tarkovsky."
    },
    "Hiện đại & Năng động": {
        "Music Video (MV)": "dynamic camera movement, quick cuts, stylized color grading, lens flares, energetic and rhythmic.",
        "Quảng cáo Thương mại": "clean, bright lighting, crisp focus, macro shots of product details, upbeat and positive mood.",
        "Phim tài liệu (Docu-style)": "handheld camera feel, naturalistic, rack focus, intimate interviews, authentic and raw, style of David Attentracer."
    },
    "Cổ điển & Hoài niệm (Vintage)": {
        "Phim 8mm Cổ điển": "8mm vintage film look, grainy texture, warm sepia tones, light leaks, film scratches, nostalgic feel.",
        "VHS Thập niên 90": "90s VHS look, slightly blurry, scan lines, timestamp in corner, washed-out colors, retro aesthetic.",
        "Phim câm (Silent Film)": "black and white, exaggerated gestures, title cards for dialogue, grainy, style of Charlie Chaplin."
    }
};