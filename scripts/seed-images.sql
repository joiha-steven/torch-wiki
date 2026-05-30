-- Extra images for Malkoff flashlights
-- Run in Supabase SQL Editor

INSERT INTO flashlight_images (flashlight_id, url, sort_order)
SELECT id, 'https://malkoffdevices.com/cdn/shop/files/MalkoffHTLFlashlightfront.jpg', 0
FROM flashlights WHERE slug = 'malkoff-mdc-htl-v3-ezp'
UNION ALL
SELECT id, 'https://malkoffdevices.com/cdn/shop/files/MalkoffHTLFlashlightrear.jpg', 1
FROM flashlights WHERE slug = 'malkoff-mdc-htl-v3-ezp'
UNION ALL
SELECT id, 'https://malkoffdevices.com/cdn/shop/files/MalkoffHTLFlashlightCap.jpg', 2
FROM flashlights WHERE slug = 'malkoff-mdc-htl-v3-ezp'
UNION ALL
SELECT id, 'https://malkoffdevices.com/cdn/shop/files/IMG_E9409.jpg', 3
FROM flashlights WHERE slug = 'malkoff-mdc-htl-v3-ezp'

UNION ALL
SELECT id, 'https://malkoffdevices.com/cdn/shop/files/Capture0001.png', 0
FROM flashlights WHERE slug = 'malkoff-mdx21700-m61'
UNION ALL
SELECT id, 'https://malkoffdevices.com/cdn/shop/files/Capture4_a5778aba-162f-4154-b7a2-7944f087440c.png', 1
FROM flashlights WHERE slug = 'malkoff-mdx21700-m61'
UNION ALL
SELECT id, 'https://malkoffdevices.com/cdn/shop/files/Capture6.png', 2
FROM flashlights WHERE slug = 'malkoff-mdx21700-m61'
UNION ALL
SELECT id, 'https://malkoffdevices.com/cdn/shop/files/Capture5.png', 3
FROM flashlights WHERE slug = 'malkoff-mdx21700-m61'

UNION ALL
SELECT id, 'https://malkoffdevices.com/cdn/shop/files/MDC18650DFBodyE2XTLcapclip_8eafd783-93fa-445b-95ea-27319946b39f.jpg', 0
FROM flashlights WHERE slug = 'malkoff-mdc-e2xtl-v3-ezp'
UNION ALL
SELECT id, 'https://malkoffdevices.com/cdn/shop/files/IMG_E9409_0983cb73-f5f9-44df-9342-645608144366.jpg', 1
FROM flashlights WHERE slug = 'malkoff-mdc-e2xtl-v3-ezp'

UNION ALL
SELECT id, 'https://malkoffdevices.com/cdn/shop/products/NewMD2CrenellatedHeadside.jpg', 0
FROM flashlights WHERE slug = 'malkoff-mdx2-m61-high-low-switch'
UNION ALL
SELECT id, 'https://malkoffdevices.com/cdn/shop/products/MD2M61Tricapside.jpg', 1
FROM flashlights WHERE slug = 'malkoff-mdx2-m61-high-low-switch'
UNION ALL
SELECT id, 'https://malkoffdevices.com/cdn/shop/products/MD2M61CrenellatedTricapside.jpg', 2
FROM flashlights WHERE slug = 'malkoff-mdx2-m61-high-low-switch'

UNION ALL
SELECT id, 'https://malkoffdevices.com/cdn/shop/products/IMG_20210216_165657125.jpg', 0
FROM flashlights WHERE slug = 'malkoff-mdx2-m61'
UNION ALL
SELECT id, 'https://malkoffdevices.com/cdn/shop/products/MD2M61Tricapside_a313c209-050e-4044-ad7e-3b8a6a40a3f4.jpg', 1
FROM flashlights WHERE slug = 'malkoff-mdx2-m61'
UNION ALL
SELECT id, 'https://malkoffdevices.com/cdn/shop/products/MD2M61CrenellatedTricapside_9c908444-b68b-454b-9ec5-29db3f0a895e.jpg', 2
FROM flashlights WHERE slug = 'malkoff-mdx2-m61'

UNION ALL
SELECT id, 'https://malkoffdevices.com/cdn/shop/products/NewMD2M61T-HOTfront_a6b2d751-16f0-42f8-9a34-c0da49266ed3.jpg', 0
FROM flashlights WHERE slug = 'malkoff-mdx2-m61hot-v2'
UNION ALL
SELECT id, 'https://malkoffdevices.com/cdn/shop/products/M61HOTMD2side.jpg', 1
FROM flashlights WHERE slug = 'malkoff-mdx2-m61hot-v2'
UNION ALL
SELECT id, 'https://malkoffdevices.com/cdn/shop/files/NewMD2CrenellatedHeadside_800x800_cd489372-95d5-44d9-9785-350f982fb4c5.jpg', 2
FROM flashlights WHERE slug = 'malkoff-mdx2-m61hot-v2'
UNION ALL
SELECT id, 'https://malkoffdevices.com/cdn/shop/files/MD2M61CrenellatedTricapside_800x800_74308985-cc9e-45ba-b10c-42967d2283ab.jpg', 3
FROM flashlights WHERE slug = 'malkoff-mdx2-m61hot-v2'

UNION ALL
SELECT id, 'https://malkoffdevices.com/cdn/shop/products/NewMD2M61T-HOTfront.jpg', 0
FROM flashlights WHERE slug = 'malkoff-mdx2-m61t'
UNION ALL
SELECT id, 'https://malkoffdevices.com/cdn/shop/products/MD2M61Tricapside_6b768419-f50e-467f-9012-07cb1c9a1c5a.jpg', 1
FROM flashlights WHERE slug = 'malkoff-mdx2-m61t'

UNION ALL
SELECT id, 'https://malkoffdevices.com/cdn/shop/products/Malkoff_MDC_Bodyguard_V2_18650_Apart2.jpg', 0
FROM flashlights WHERE slug = 'malkoff-mdc-bodyguard-v2-18650'
UNION ALL
SELECT id, 'https://malkoffdevices.com/cdn/shop/products/Malkoff_MDC_Bodyguard_V2_18650_Apart.jpg', 1
FROM flashlights WHERE slug = 'malkoff-mdc-bodyguard-v2-18650'
UNION ALL
SELECT id, 'https://malkoffdevices.com/cdn/shop/products/Malkoff_MDC_Bodyguard_V2_18650_Front.jpg', 2
FROM flashlights WHERE slug = 'malkoff-mdc-bodyguard-v2-18650';
