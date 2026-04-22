import { useState, useEffect, useRef } from "react";

// ─── THEME ────────────────────────────────────────────────────────────────────
const THEMES = {
  didem: {
    primary: "#E8607A",
    secondary: "#F2A7B5",
    light: "#FFF0F3",
    accent: "#C94A62",
    bg: "#FFF7F9",
    cardBg: "#FFFFFF",
    text: "#3D1A22",
    subtext: "#9B6472",
    gradient: "linear-gradient(135deg, #E8607A 0%, #F5A0B0 100%)",
    calGradient: "linear-gradient(135deg, #FFF0F3, #FFDDE4)",
    name: "Didem",
    emoji: "🌸",
    target: "52 kg hedef",
    goal: "Yağ yakımı & form",
    calRange: "1300–1600 kcal",
  },
  murat: {
    primary: "#2C72E8",
    secondary: "#6AA3F5",
    light: "#EEF4FF",
    accent: "#1A52C9",
    bg: "#F5F8FF",
    cardBg: "#FFFFFF",
    text: "#0D1F3C",
    subtext: "#5470A0",
    gradient: "linear-gradient(135deg, #2C72E8 0%, #5E9CF5 100%)",
    calGradient: "linear-gradient(135deg, #EEF4FF, #D6E6FF)",
    name: "Murat",
    emoji: "💪",
    target: "70 kg hedef",
    goal: "Kas & protein odaklı",
    calRange: "2000–2400 kcal",
  },
};

const MEAL_ICONS = { breakfast: "☀️", lunch: "🥗", dinner: "🍽️", snack: "🍎" };
const MEAL_LABELS = { breakfast: "Kahvaltı", lunch: "Öğle", dinner: "Akşam", snack: "Ara Öğün" };

// ─── DIET DATA ────────────────────────────────────────────────────────────────
// Pre-generated 30-day plans (realistic, no exotic foods, varied but sustainable)
const DIET_DATA = {
  didem: [
    { day:1, meals:{ breakfast:{items:"2 haşlanmış yumurta, 1 dilim tam buğday ekmeği, salatalık-domates",portions:"2 adet yumurta, 1 ince dilim ekmek, 1 su bardağı sebze",calories:340}, lunch:{items:"Izgara tavuk göğsü, mevsim salatası, zeytinyağı-limon",portions:"120g tavuk, büyük tabak salata, 1 tatlı kaşığı zeytinyağı",calories:310}, dinner:{items:"Sebzeli mercimek çorbası, yoğurt",portions:"2 su bardağı çorba, 150g yoğurt",calories:320}, snack:{items:"Elma, az yağlı beyaz peynir",portions:"1 orta boy elma, 30g peynir",calories:170} }, total_calories:1140 },
    { day:2, meals:{ breakfast:{items:"Lor peyniri, domates, salatalık, 1 dilim çavdar ekmeği",portions:"80g lor, 2 dilim domates, yarım salatalık, 1 dilim ekmek",calories:280}, lunch:{items:"Fırın sebzeli tavuk, bulgur pilavı",portions:"120g tavuk, 4 yemek kaşığı bulgur",calories:390}, dinner:{items:"Yeşil mercimek salatası, haşlanmış yumurta",portions:"1,5 su bardağı mercimek, 1 yumurta, yeşillik",calories:340}, snack:{items:"Yoğurt, tatlı kırmızı biber",portions:"150g yoğurt, 1 kırmızı biber",calories:130} }, total_calories:1140 },
    { day:3, meals:{ breakfast:{items:"Yulaf ezmesi, süt, tarçın, 5 badem",portions:"4 yemek kaşığı yulaf, 150ml süt, 5 adet badem",calories:310}, lunch:{items:"Ton balıklı sebze salatası",portions:"80g konserve ton, bol yeşillik, 1 tatlı kaşığı zeytinyağı",calories:280}, dinner:{items:"Fırın somon, buharda brokoli, bulgur",portions:"120g somon, 1 su bardağı brokoli, 3 kaşık bulgur",calories:410}, snack:{items:"Muz",portions:"1 orta boy muz",calories:90} }, total_calories:1090 },
    { day:4, meals:{ breakfast:{items:"Menemen (2 yumurta, domates, biber), 1 dilim ekmek",portions:"2 yumurta, 1 domates, 1 biber, 1 dilim ekmek",calories:360}, lunch:{items:"Kırmızı mercimek çorbası, tam buğday ekmek",portions:"2 su bardağı çorba, 1 dilim ekmek",calories:320}, dinner:{items:"Izgara sebzeli tavuk bonfile, yeşil salata",portions:"130g tavuk, ızgara kabak-patlıcan, tabak salata",calories:350}, snack:{items:"Süt, 3 tam buğday grisini",portions:"150ml süt, 3 grisini",calories:160} }, total_calories:1190 },
    { day:5, meals:{ breakfast:{items:"2 yumurta sahanda (az yağ), domates, çay yeşil zeytin",portions:"2 yumurta, 2 domates, 5 zeytin",calories:330}, lunch:{items:"Sebzeli pirinç pilavı, cacık",portions:"5 kaşık pilav, 150g cacık",calories:370}, dinner:{items:"Köfte (az yağlı), buharda ıspanak, yoğurt",portions:"3 adet köfte (150g), 1 su bardağı ıspanak, 100g yoğurt",calories:400}, snack:{items:"Portakal",portions:"1 büyük portakal",calories:80} }, total_calories:1180 },
    { day:6, meals:{ breakfast:{items:"Yoğurt, yulaf, muz, tarçın",portions:"150g yoğurt, 3 kaşık yulaf, yarım muz",calories:290}, lunch:{items:"Mercimek köftesi, mevsim salatası",portions:"6 adet mercimek köftesi, büyük tabak salata",calories:350}, dinner:{items:"Fırın tavuk but (derisiz), zeytinyağlı taze fasulye",portions:"1 küçük but (120g et), 1 su bardağı fasulye",calories:380}, snack:{items:"Havuç, yoğurt",portions:"2 orta havuç, 100g yoğurt",calories:120} }, total_calories:1140 },
    { day:7, meals:{ breakfast:{items:"Lor peyniri-otlu börek (ev yapımı, ince), domates",portions:"1 dilim börek (80g), 2 domates",calories:310}, lunch:{items:"Izgara balık (levrek), közlenmiş sebze",portions:"150g balık, 1 su bardağı sebze",calories:320}, dinner:{items:"Şehriyeli tavuk çorbası, yoğurt",portions:"2 su bardağı çorba, 150g yoğurt",calories:330}, snack:{items:"Elma, 5 ceviz içi",portions:"1 elma, 5 yarım ceviz",calories:190} }, total_calories:1150 },
    { day:8, meals:{ breakfast:{items:"Tam buğday ekmek, avokado, 2 haşlanmış yumurta",portions:"1 dilim ekmek, çeyrek avokado, 2 yumurta",calories:360}, lunch:{items:"Nohutlu ıspanak yemeği",portions:"1 su bardağı nohut, 1 su bardağı ıspanak",calories:340}, dinner:{items:"Ton balıklı makarna (az)",portions:"60g tam buğday makarna, 60g ton, domates sosu",calories:380}, snack:{items:"Kefir",portions:"200ml kefir",calories:110} }, total_calories:1190 },
    { day:9, meals:{ breakfast:{items:"Yulaf ezmesi, elma rendesi, tarçın, süt",portions:"4 kaşık yulaf, yarım elma, 150ml süt",calories:290}, lunch:{items:"Izgara tavuk salatası, zeytinyağlı soslu",portions:"120g tavuk, bol karışık yeşillik",calories:300}, dinner:{items:"Tarhana çorbası, tam buğday ekmek, beyaz peynir",portions:"2 su bardağı çorba, 1 dilim ekmek, 30g peynir",calories:350}, snack:{items:"Yoğurt, yarım muz",portions:"150g yoğurt, yarım muz",calories:140} }, total_calories:1080 },
    { day:10, meals:{ breakfast:{items:"2 yumurta peynirli omlet, domates-biber",portions:"2 yumurta, 20g peynir, 1 domates, 1 biber",calories:330}, lunch:{items:"Sebzeli kıymalı bulgur",portions:"5 kaşık bulgur, 60g kıyma, sebze",calories:390}, dinner:{items:"Fırın balık (palamut), roka salatası",portions:"150g balık, büyük tabak roka",calories:340}, snack:{items:"Portakal, 5 badem",portions:"1 portakal, 5 badem",calories:130} }, total_calories:1190 },
    { day:11, meals:{ breakfast:{items:"Çılbır (poşe yumurta, yoğurt, tereyağlı pul biber), ekmek",portions:"2 yumurta, 100g yoğurt, 1 dilim ekmek",calories:350}, lunch:{items:"Kırmızı mercimek çorbası, mevsim salatası",portions:"2 su bardağı çorba, tabak salata",calories:310}, dinner:{items:"Izgara köfte, sebze garnütürü",portions:"3 adet köfte, ızgara biber-kabak",calories:380}, snack:{items:"Kefir",portions:"200ml kefir",calories:110} }, total_calories:1150 },
    { day:12, meals:{ breakfast:{items:"Lor peyniri, salatalık, domates, 5 zeytin, 1 dilim ekmek",portions:"80g lor, 2 dilim domates, 5 zeytin",calories:290}, lunch:{items:"Zeytinyağlı kuru fasulye, pilav az",portions:"1 su bardağı fasulye, 3 kaşık pilav",calories:410}, dinner:{items:"Buharda tavuk, yoğurt çorbası",portions:"120g tavuk, 2 su bardağı çorba",calories:360}, snack:{items:"Elma",portions:"1 büyük elma",calories:80} }, total_calories:1140 },
    { day:13, meals:{ breakfast:{items:"Yulaf-muz-süt smoothie",portions:"4 kaşık yulaf, yarım muz, 200ml süt",calories:300}, lunch:{items:"Akdeniz salatası (ton, zeytinyağı, limon, sebze)",portions:"70g ton, bol sebze, 1 tatlı kaşığı zeytinyağı",calories:290}, dinner:{items:"Fırın sebzeli tavuk, tam buğday ekmek",portions:"130g tavuk, 1 dilim ekmek",calories:390}, snack:{items:"Yoğurt, çilek",portions:"150g yoğurt, 80g çilek",calories:130} }, total_calories:1110 },
    { day:14, meals:{ breakfast:{items:"Sahanda yumurta, domates, biber, az peynir",portions:"2 yumurta, 1 domates, 30g peynir",calories:340}, lunch:{items:"Bulgur pilavı, mercimek salatası",portions:"4 kaşık bulgur, 1 su bardağı pişmiş mercimek",calories:360}, dinner:{items:"Izgara levrek, buharda brokoli",portions:"160g levrek, 1,5 su bardağı brokoli",calories:310}, snack:{items:"1 avuç fındık",portions:"20g fındık",calories:130} }, total_calories:1140 },
    { day:15, meals:{ breakfast:{items:"Kepekli ekmek, avokado, 1 haşlanmış yumurta",portions:"1 dilim ekmek, çeyrek avokado, 1 yumurta",calories:310}, lunch:{items:"Zeytinyağlı biber dolması (pirinçsiz, sebzeli)",portions:"3 adet orta dolma",calories:280}, dinner:{items:"Tavuk sote (sebzeli), yoğurt",portions:"120g tavuk, 1 su bardağı sebze, 150g yoğurt",calories:380}, snack:{items:"Portakal, 3 tam buğday grisini",portions:"1 portakal, 3 grisini",calories:140} }, total_calories:1110 },
    { day:16, meals:{ breakfast:{items:"Yulaf ezmesi, süt, kuru üzüm az, tarçın",portions:"4 kaşık yulaf, 150ml süt, 1 çay kaşığı üzüm",calories:300}, lunch:{items:"Kuru fasulye çorbası, tam buğday ekmek",portions:"2 su bardağı çorba, 1 dilim ekmek",calories:330}, dinner:{items:"Fırın somon, zeytinyağlı yeşil fasulye",portions:"130g somon, 1 su bardağı fasulye",calories:400}, snack:{items:"Kefir",portions:"200ml kefir",calories:110} }, total_calories:1140 },
    { day:17, meals:{ breakfast:{items:"Menemen (2 yumurta), 1 dilim çavdar ekmeği",portions:"2 yumurta, 1 domates, 1 biber, 1 dilim ekmek",calories:350}, lunch:{items:"Izgara tavuk bonfile, quinoa salatası",portions:"120g tavuk, 4 kaşık quinoa, yeşillik",calories:380}, dinner:{items:"Mercimek çorbası, yoğurt",portions:"2 su bardağı çorba, 150g yoğurt",calories:320}, snack:{items:"Elma, 5 badem",portions:"1 elma, 5 badem",calories:140} }, total_calories:1190 },
    { day:18, meals:{ breakfast:{items:"Yoğurt parfesi: yoğurt, yulaf, meyve",portions:"150g yoğurt, 3 kaşık yulaf, 80g çilek",calories:280}, lunch:{items:"Ton balıklı tam buğday sandviç",portions:"2 dilim ekmek, 70g ton, domates, marul",calories:340}, dinner:{items:"Fırın tavuk but (derisiz), ızgara patlıcan",portions:"1 but (120g et), 1 orta patlıcan",calories:350}, snack:{items:"Muz",portions:"1 küçük muz",calories:90} }, total_calories:1060 },
    { day:19, meals:{ breakfast:{items:"2 haşlanmış yumurta, beyaz peynir, domates, zeytin",portions:"2 yumurta, 30g peynir, 2 domates, 5 zeytin",calories:340}, lunch:{items:"Sebzeli nohut yemeği",portions:"1 su bardağı nohut, sebze karışımı",calories:360}, dinner:{items:"Balık çorbası, tam buğday ekmek",portions:"2 su bardağı çorba, 1 dilim ekmek",calories:310}, snack:{items:"Yoğurt, tarçın",portions:"200g yoğurt",calories:120} }, total_calories:1130 },
    { day:20, meals:{ breakfast:{items:"Karabuğday lapası, süt, muz",portions:"4 kaşık karabuğday unu, 150ml süt, yarım muz",calories:310}, lunch:{items:"Izgara tavuk, mevsim salatası",portions:"130g tavuk, büyük tabak salata",calories:300}, dinner:{items:"Zeytinyağlı kırmızı mercimek, yoğurt",portions:"2 su bardağı yemek, 100g yoğurt",calories:380}, snack:{items:"Portakal",portions:"1 büyük portakal",calories:80} }, total_calories:1070 },
    { day:21, meals:{ breakfast:{items:"Çılbır, 1 dilim ekmek",portions:"2 yumurta, 100g yoğurt, 1 dilim ekmek",calories:350}, lunch:{items:"Bulgur pilavı, domates çorbası",portions:"5 kaşık bulgur, 2 su bardağı çorba",calories:350}, dinner:{items:"Izgara köfte, yeşil salata, cacık",portions:"3 köfte, tabak salata, 100g cacık",calories:390}, snack:{items:"5 ceviz, elma",portions:"5 yarım ceviz, 1 elma",calories:190} }, total_calories:1280 },
    { day:22, meals:{ breakfast:{items:"Yulaf ezmesi, elma, tarçın, 5 badem",portions:"4 kaşık yulaf, yarım elma, 5 badem",calories:290}, lunch:{items:"Tavuk çorbalı bulgur (tarhana usulü)",portions:"5 kaşık bulgur, 2 su bardağı çorba",calories:380}, dinner:{items:"Fırın sebzeli balık, yoğurt",portions:"150g balık, 1 su bardağı sebze, 100g yoğurt",calories:350}, snack:{items:"Kefir",portions:"200ml kefir",calories:110} }, total_calories:1130 },
    { day:23, meals:{ breakfast:{items:"Lor peyniri, mevsim sebzeleri, 1 dilim ekmek",portions:"80g lor, bol sebze, 1 dilim ekmek",calories:280}, lunch:{items:"Zeytinyağlı enginar (ya da taze fasulye), bulgur",portions:"1,5 su bardağı sebze yemeği, 3 kaşık bulgur",calories:340}, dinner:{items:"Tavuk şiş, cacık",portions:"120g tavuk, 150g cacık",calories:320}, snack:{items:"Muz, 5 badem",portions:"1 küçük muz, 5 badem",calories:150} }, total_calories:1090 },
    { day:24, meals:{ breakfast:{items:"2 yumurta omlet (peynirli, otlu), domates",portions:"2 yumurta, 20g peynir, 1 domates",calories:310}, lunch:{items:"Mercimek köftesi, yoğurtlu sos, salata",portions:"6 köfte, 100g yoğurt, tabak salata",calories:360}, dinner:{items:"Sebzeli pirinç çorbası, tam buğday ekmek",portions:"2 su bardağı çorba, 1 dilim ekmek",calories:290}, snack:{items:"Yoğurt, çilek",portions:"150g yoğurt, 80g çilek",calories:130} }, total_calories:1090 },
    { day:25, meals:{ breakfast:{items:"Kepekli ekmek, avokado, haşlanmış yumurta, pul biber",portions:"1 dilim ekmek, çeyrek avokado, 2 yumurta",calories:360}, lunch:{items:"Zeytinyağlı kuru fasulye, kavurma pirinç az",portions:"1 su bardağı fasulye, 3 kaşık pilav",calories:400}, dinner:{items:"Izgara somon, brokoli, limon",portions:"130g somon, 1,5 su bardağı brokoli",calories:370}, snack:{items:"Portakal",portions:"1 büyük portakal",calories:80} }, total_calories:1210 },
    { day:26, meals:{ breakfast:{items:"Yulaf-süt-tarçın pişi (fırın)",portions:"4 kaşık yulaf, 150ml süt, tarçın",calories:290}, lunch:{items:"Tavuk çorbası, yoğurt",portions:"2 su bardağı çorba, 150g yoğurt",calories:300}, dinner:{items:"Izgara köfte, taze fasulye yemeği",portions:"3 köfte, 1 su bardağı fasulye",calories:390}, snack:{items:"Elma, 5 ceviz",portions:"1 elma, 5 yarım ceviz",calories:190} }, total_calories:1170 },
    { day:27, meals:{ breakfast:{items:"Menemen (2 yumurta), çavdar ekmeği",portions:"2 yumurta, 1 biber, 1 domates, 1 dilim ekmek",calories:350}, lunch:{items:"Nohutlu ıspanak, yoğurt",portions:"1 su bardağı nohut, 1 su bardağı ıspanak, 100g yoğurt",calories:380}, dinner:{items:"Fırın balık, mevsim salatası",portions:"150g balık, büyük tabak salata",calories:310}, snack:{items:"Kefir",portions:"200ml kefir",calories:110} }, total_calories:1150 },
    { day:28, meals:{ breakfast:{items:"Yoğurt parfesi, granola az, çilek",portions:"150g yoğurt, 2 kaşık granola, 80g çilek",calories:280}, lunch:{items:"Ton balıklı salata",portions:"80g ton, bol yeşillik, 1 kaşık zeytinyağı",calories:290}, dinner:{items:"Fırın tavuk bonfile, sebzeli bulgur",portions:"130g tavuk, 5 kaşık bulgur, sebze",calories:410}, snack:{items:"Muz",portions:"1 küçük muz",calories:90} }, total_calories:1070 },
    { day:29, meals:{ breakfast:{items:"2 haşlanmış yumurta, beyaz peynir, domates, zeytin",portions:"2 yumurta, 30g peynir, 2 domates, 5 zeytin",calories:340}, lunch:{items:"Kırmızı mercimek çorbası, mevsim salatası",portions:"2 su bardağı çorba, tabak salata",calories:310}, dinner:{items:"Izgara tavuk şiş, cacık, yeşil salata",portions:"130g tavuk, 150g cacık, tabak salata",calories:370}, snack:{items:"Yoğurt, elma",portions:"150g yoğurt, 1 elma",calories:160} }, total_calories:1180 },
    { day:30, meals:{ breakfast:{items:"Yulaf ezmesi, süt, muz, tarçın",portions:"4 kaşık yulaf, 150ml süt, yarım muz",calories:300}, lunch:{items:"Zeytinyağlı biber dolması (sebzeli), yoğurt",portions:"3 dolma, 150g yoğurt",calories:310}, dinner:{items:"Fırın somon, buharda karnabahar, bulgur az",portions:"130g somon, 1 su bardağı karnabahar, 3 kaşık bulgur",calories:400}, snack:{items:"Portakal, 5 badem",portions:"1 portakal, 5 badem",calories:130} }, total_calories:1140 },
  ],
  murat: [
    { day:1, meals:{ breakfast:{items:"4 yumurta haşlanmış, yulaf ezmesi süt ile, muz",portions:"4 yumurta, 6 kaşık yulaf, 200ml süt, 1 muz",calories:620}, lunch:{items:"Tavuk göğsü ızgara, bulgur pilavı, yeşil salata",portions:"180g tavuk, 8 kaşık bulgur, büyük tabak salata",calories:610}, dinner:{items:"Kırmızı et (bonfile/dana), zeytinyağlı sebze, pirinç",portions:"180g et, 1 su bardağı sebze, 5 kaşık pilav",calories:620}, snack:{items:"Yoğurt, protein ağırlıklı karışım (badem-fındık)",portions:"200g yoğurt, 30g karışık kuruyemiş",calories:260} }, total_calories:2110 },
    { day:2, meals:{ breakfast:{items:"Kaşarlı-domatesli omlet, yulaf ezmesi",portions:"4 yumurta, 30g kaşar, 6 kaşık yulaf, 200ml süt",calories:650}, lunch:{items:"Pirzola, mercimek çorbası, tam buğday ekmek",portions:"200g pirzola, 2 su bardağı çorba, 2 dilim ekmek",calories:680}, dinner:{items:"Tavuk göğsü sote (sebzeli), bulgur",portions:"180g tavuk, 7 kaşık bulgur",calories:570}, snack:{items:"Süt, muz, yulaf smoohie",portions:"250ml süt, 1 muz, 3 kaşık yulaf",calories:290} }, total_calories:2190 },
    { day:3, meals:{ breakfast:{items:"Sahanda yumurta (4), peynir, zeytin, tam buğday ekmek",portions:"4 yumurta, 40g peynir, 10 zeytin, 2 dilim ekmek",calories:600}, lunch:{items:"Ton balıklı makarna, bol sebzeli",portions:"100g makarna (kuru), 120g ton, sebze",calories:650}, dinner:{items:"Izgara köfte, pilav, cacık",portions:"5 köfte (250g), 6 kaşık pilav, 150g cacık",calories:680}, snack:{items:"Haşlanmış 2 yumurta, peynir",portions:"2 yumurta, 40g beyaz peynir",calories:230} }, total_calories:2160 },
    { day:4, meals:{ breakfast:{items:"Yulaf-muz-fıstık ezmesi-süt karışımı",portions:"6 kaşık yulaf, 1 muz, 1 yemek kaşığı fıstık ezmesi, 200ml süt",calories:570}, lunch:{items:"Fırın tavuk but (2 adet), zeytinyağlı taze fasulye, pilav",portions:"2 but (220g et), 1 su bardağı fasulye, 5 kaşık pilav",calories:700}, dinner:{items:"Kıymalı bulgur, yoğurt çorbası",portions:"8 kaşık bulgur, 60g kıyma, 2 su bardağı çorba",calories:620}, snack:{items:"Yoğurt, granola, meyve",portions:"200g yoğurt, 3 kaşık granola, 1 muz",calories:320} }, total_calories:2210 },
    { day:5, meals:{ breakfast:{items:"4 haşlanmış yumurta, avokado, tam buğday ekmek",portions:"4 yumurta, yarım avokado, 2 dilim ekmek",calories:610}, lunch:{items:"Izgara somon, bulgur, yeşil salata",portions:"200g somon, 7 kaşık bulgur, büyük tabak",calories:680}, dinner:{items:"Dana biftek (az yağlı), ızgara sebze, pirinç",portions:"180g biftek, 1 su bardağı sebze, 5 kaşık pilav",calories:650}, snack:{items:"Fıstık ezmeli ekmek, süt",portions:"1 dilim ekmek, 1 kaşık fıstık ezmesi, 250ml süt",calories:290} }, total_calories:2230 },
    { day:6, meals:{ breakfast:{items:"Yulaf ezmesi, süt, 4 adet haşlanmış yumurta beyazı+2 tam",portions:"6 kaşık yulaf, 200ml süt, 4 yumurta beyazı, 2 tam yumurta",calories:570}, lunch:{items:"Tavuk şiş (5 şiş), bulgur pilavı, cacık",portions:"200g tavuk, 8 kaşık bulgur, 150g cacık",calories:650}, dinner:{items:"Kırmızı mercimek çorbası, kıymalı makarna az",portions:"2 su bardağı çorba, 80g makarna, 60g kıyma",calories:620}, snack:{items:"Yoğurt, badem",portions:"200g yoğurt, 20g badem",calories:260} }, total_calories:2100 },
    { day:7, meals:{ breakfast:{items:"Peynirli-sebzeli omlet (4 yumurta), tam buğday ekmek",portions:"4 yumurta, 40g peynir, sebze, 2 dilim ekmek",calories:620}, lunch:{items:"Zeytinyağlı kuru fasulye, pilav, salata",portions:"2 su bardağı fasulye, 6 kaşık pilav, tabak salata",calories:680}, dinner:{items:"Tavuk göğsü ızgara, sebzeli bulgur",portions:"200g tavuk, 8 kaşık bulgur",calories:610}, snack:{items:"Süt, muz, yulaf smoothie",portions:"250ml süt, 1 muz, 3 kaşık yulaf",calories:290} }, total_calories:2200 },
    { day:8, meals:{ breakfast:{items:"Yulaf-badem sütü-tarçın-meyve kasesi",portions:"6 kaşık yulaf, 200ml süt, 1 muz, 1 elma küçük",calories:550}, lunch:{items:"Fırın somon, pirinç pilavı, brokoli",portions:"200g somon, 6 kaşık pilav, 1,5 su bardağı brokoli",calories:700}, dinner:{items:"Tavuk çorbası (yoğun), tam buğday ekmek, peynir",portions:"2,5 su bardağı çorba, 2 dilim ekmek, 40g peynir",calories:560}, snack:{items:"4 haşlanmış yumurta, salatalık",portions:"4 yumurta, 1 salatalık",calories:280} }, total_calories:2090 },
    { day:9, meals:{ breakfast:{items:"4 yumurta sahanda, yulaf ezmesi, portakal",portions:"4 yumurta, 6 kaşık yulaf, 1 portakal",calories:580}, lunch:{items:"Izgara köfte, bulgur, yeşil salata",portions:"5 köfte (250g), 7 kaşık bulgur, büyük salata",calories:700}, dinner:{items:"Tavuk göğsü fırında, zeytinyağlı ıspanak",portions:"200g tavuk, 1,5 su bardağı ıspanak",calories:520}, snack:{items:"Yoğurt, granola, fındık",portions:"200g yoğurt, 3 kaşık granola, 15g fındık",calories:300} }, total_calories:2100 },
    { day:10, meals:{ breakfast:{items:"Omlet (4 yumurta, kaşar, ıspanak), ekmek",portions:"4 yumurta, 30g kaşar, 1 su bardağı ıspanak, 2 dilim ekmek",calories:620}, lunch:{items:"Sebzeli pirinç + ton balığı",portions:"7 kaşık pilav, 120g ton, sebze",calories:650}, dinner:{items:"Dana kıymalı patlıcan musakka, yoğurt",portions:"2 porsiyon (250g), 150g yoğurt",calories:620}, snack:{items:"Süt, muz",portions:"300ml süt, 1 büyük muz",calories:260} }, total_calories:2150 },
    { day:11, meals:{ breakfast:{items:"Yulaf-süt-tarçın-muz karışımı, 2 haşlanmış yumurta",portions:"6 kaşık yulaf, 200ml süt, 1 muz, 2 yumurta",calories:590}, lunch:{items:"Tavuk şiş, bulgur, cacık",portions:"200g tavuk, 8 kaşık bulgur, 150g cacık",calories:670}, dinner:{items:"Mercimek çorbası, kıymalı ekmek (pide tarzı)",portions:"2 su bardağı çorba, 2 dilim pide, 60g kıyma",calories:620}, snack:{items:"Yoğurt, badem, elma",portions:"200g yoğurt, 20g badem, 1 elma",calories:300} }, total_calories:2180 },
    { day:12, meals:{ breakfast:{items:"4 haşlanmış yumurta, avokado, tam buğday ekmek, domates",portions:"4 yumurta, yarım avokado, 2 dilim ekmek, 2 domates",calories:610}, lunch:{items:"Izgara tavuk + sebzeli bulgur",portions:"200g tavuk, 8 kaşık bulgur",calories:640}, dinner:{items:"Pirzola (küçük 2 adet), ızgara sebze, pilav",portions:"200g pirzola, sebze, 5 kaşık pilav",calories:660}, snack:{items:"Fıstık ezmeli muz smoothie",portions:"1 muz, 1 kaşık fıstık ezmesi, 200ml süt",calories:300} }, total_calories:2210 },
    { day:13, meals:{ breakfast:{items:"Kaşarlı omlet, yulaf ezmesi, muz",portions:"4 yumurta, 30g kaşar, 6 kaşık yulaf, 1 muz",calories:660}, lunch:{items:"Nohutlu tavuk yemeği, pilav",portions:"1 su bardağı nohut, 150g tavuk, 5 kaşık pilav",calories:710}, dinner:{items:"Balık (palamut/levrek) fırında, bulgur",portions:"200g balık, 7 kaşık bulgur",calories:610}, snack:{items:"Süt, 2 yumurta haşlanmış",portions:"250ml süt, 2 yumurta",calories:270} }, total_calories:2250 },
    { day:14, meals:{ breakfast:{items:"Yulaf porridge, süt, fındık, kuru üzüm az",portions:"6 kaşık yulaf, 200ml süt, 20g fındık, 1 tatlı kaşığı üzüm",calories:590}, lunch:{items:"Izgara dana bonfile, yeşil salata, pilav",portions:"180g et, büyük tabak salata, 6 kaşık pilav",calories:690}, dinner:{items:"Tavuk çorbası, peynirli ekmek",portions:"2,5 su bardağı çorba, 2 dilim ekmek, 40g peynir",calories:570}, snack:{items:"Yoğurt, granola, çilek",portions:"200g yoğurt, 3 kaşık granola, 80g çilek",calories:290} }, total_calories:2140 },
    { day:15, meals:{ breakfast:{items:"4 sahanda yumurta, zeytin, peynir, ekmek",portions:"4 yumurta, 10 zeytin, 40g peynir, 2 dilim ekmek",calories:630}, lunch:{items:"Fırın somon, pirinç, brokoli-karnabahar karışımı",portions:"200g somon, 7 kaşık pilav, 1,5 su bardağı sebze",calories:720}, dinner:{items:"Kıymalı bulgur köftesi, yoğurt",portions:"6 köfte (250g), 200g yoğurt",calories:630}, snack:{items:"Muz, badem, süt",portions:"1 muz, 20g badem, 200ml süt",calories:310} }, total_calories:2290 },
    { day:16, meals:{ breakfast:{items:"Yulaf-muz-süt-fıstık ezmesi karışımı (ısıtılmış)",portions:"6 kaşık yulaf, 1 muz, 200ml süt, 1 kaşık fıstık ezmesi",calories:580}, lunch:{items:"Tavuk göğsü sote, bulgur, salata",portions:"200g tavuk, 8 kaşık bulgur, büyük tabak salata",calories:660}, dinner:{items:"Zeytinyağlı kuru fasulye, pilav",portions:"2 su bardağı fasulye, 6 kaşık pilav",calories:620}, snack:{items:"4 haşlanmış yumurta, salatalık-domates",portions:"4 yumurta, sebze",calories:270} }, total_calories:2130 },
    { day:17, meals:{ breakfast:{items:"Menemen (4 yumurta), peynir, ekmek",portions:"4 yumurta, 2 domates, 2 biber, 30g peynir, 2 dilim ekmek",calories:620}, lunch:{items:"Izgara köfte, bulgur, cacık",portions:"5 köfte, 8 kaşık bulgur, 150g cacık",calories:700}, dinner:{items:"Fırın tavuk but (2), ıspanak yemeği",portions:"2 but (220g), 1,5 su bardağı ıspanak",calories:560}, snack:{items:"Süt-yulaf-muz smoothie",portions:"250ml süt, 3 kaşık yulaf, 1 muz",calories:290} }, total_calories:2170 },
    { day:18, meals:{ breakfast:{items:"Omlet (4 yumurta, biber-domates), tam buğday ekmek",portions:"4 yumurta, 1 biber, 1 domates, 2 dilim ekmek",calories:570}, lunch:{items:"Tavuk şiş + ton balıklı makarna (mix)",portions:"120g tavuk, 80g makarna, 60g ton",calories:680}, dinner:{items:"Dana eti haşlama, pirinç, mevsim sebzesi",portions:"180g et, 5 kaşık pilav, 1 su bardağı sebze",calories:640}, snack:{items:"Yoğurt, badem, kuru kayısı az",portions:"200g yoğurt, 20g badem, 3 kayısı",calories:290} }, total_calories:2180 },
    { day:19, meals:{ breakfast:{items:"Yulaf ezmesi, süt, yumurta beyazı (3), muz",portions:"6 kaşık yulaf, 200ml süt, 3 yumurta beyazı, 1 muz",calories:570}, lunch:{items:"Tavuk göğsü fırında, sebzeli bulgur, salata",portions:"200g tavuk, 8 kaşık bulgur, tabak salata",calories:660}, dinner:{items:"Mercimek çorbası, kıymalı makarna, yoğurt",portions:"2 su bardağı çorba, 80g makarna, 60g kıyma, 100g yoğurt",calories:640}, snack:{items:"Süt, 2 haşlanmış yumurta",portions:"250ml süt, 2 yumurta",calories:260} }, total_calories:2130 },
    { day:20, meals:{ breakfast:{items:"4 yumurta sahanda, kaşar, domates, ekmek",portions:"4 yumurta, 30g kaşar, 2 domates, 2 dilim ekmek",calories:610}, lunch:{items:"Izgara somon, bulgur, yeşil salata",portions:"200g somon, 7 kaşık bulgur, büyük tabak",calories:700}, dinner:{items:"Tavuk çorbası (zengin), peynirli ekmek",portions:"2,5 su bardağı çorba, 2 dilim ekmek, 40g peynir",calories:570}, snack:{items:"Yoğurt, granola, muz",portions:"200g yoğurt, 3 kaşık granola, 1 küçük muz",calories:310} }, total_calories:2190 },
    { day:21, meals:{ breakfast:{items:"Protein omlet (4 yumurta + 3 beyaz, peynir, sebze)",portions:"4 tam + 3 beyaz yumurta, 30g peynir, sebze",calories:560}, lunch:{items:"Köfte, pirinç pilavı, cacık",portions:"5 köfte (250g), 7 kaşık pilav, 150g cacık",calories:720}, dinner:{items:"Nohutlu tavuk sote, bulgur",portions:"120g tavuk, 1 su bardağı nohut, 7 kaşık bulgur",calories:680}, snack:{items:"Süt, badem, muz",portions:"250ml süt, 20g badem, 1 muz",calories:330} }, total_calories:2290 },
    { day:22, meals:{ breakfast:{items:"Yulaf ezmesi, süt, fıstık ezmesi, elma",portions:"6 kaşık yulaf, 200ml süt, 1 kaşık fıstık ezmesi, 1 elma",calories:580}, lunch:{items:"Fırın tavuk göğsü, sebzeli pirinç",portions:"200g tavuk, 7 kaşık pilav, bol sebze",calories:660}, dinner:{items:"Ton balıklı tam buğday makarna",portions:"100g makarna, 120g ton, domates sosu",calories:620}, snack:{items:"4 haşlanmış yumurta, domates",portions:"4 yumurta, 2 domates",calories:270} }, total_calories:2130 },
    { day:23, meals:{ breakfast:{items:"4 sahanda yumurta, beyaz peynir, zeytin, çavdar ekmeği",portions:"4 yumurta, 40g peynir, 10 zeytin, 2 dilim ekmek",calories:620}, lunch:{items:"Izgara köfte, bulgur, yoğurt",portions:"5 köfte, 8 kaşık bulgur, 150g yoğurt",calories:700}, dinner:{items:"Tavuk şiş, sebzeli pilav",portions:"200g tavuk, 7 kaşık pilav, sebze",calories:620}, snack:{items:"Yoğurt-granola-badem karışımı",portions:"200g yoğurt, 3 kaşık granola, 20g badem",calories:300} }, total_calories:2240 },
    { day:24, meals:{ breakfast:{items:"Yulaf-muz-süt porridge, 2 haşlanmış yumurta",portions:"6 kaşık yulaf, 200ml süt, 1 muz, 2 yumurta",calories:610}, lunch:{items:"Dana bonfile, ızgara sebze, pilav",portions:"180g et, 1 su bardağı sebze, 6 kaşık pilav",calories:700}, dinner:{items:"Tavuk çorbası, mercimek salatası",portions:"2,5 su bardağı çorba, 1 su bardağı mercimek, yeşillik",calories:560}, snack:{items:"Süt, fıstık ezmeli muz",portions:"250ml süt, 1 muz, 1 kaşık fıstık ezmesi",calories:300} }, total_calories:2170 },
    { day:25, meals:{ breakfast:{items:"Kaşarlı-ıspanaklı omlet (4 yumurta), ekmek",portions:"4 yumurta, 30g kaşar, 1 su bardağı ıspanak, 2 dilim ekmek",calories:620}, lunch:{items:"Fırın balık (palamut), bulgur, brokoli",portions:"220g balık, 7 kaşık bulgur, 1 su bardağı brokoli",calories:680}, dinner:{items:"Zeytinyağlı kuru fasulye, pilav, yoğurt",portions:"2 su bardağı fasulye, 5 kaşık pilav, 100g yoğurt",calories:620}, snack:{items:"Muz, badem, süt",portions:"1 muz, 20g badem, 200ml süt",calories:300} }, total_calories:2220 },
    { day:26, meals:{ breakfast:{items:"Yulaf ezmesi, süt, tarçın, 4 haşlanmış yumurta",portions:"6 kaşık yulaf, 200ml süt, 4 yumurta",calories:630}, lunch:{items:"Tavuk şiş, bulgur pilavı, cacık",portions:"200g tavuk, 8 kaşık bulgur, 150g cacık",calories:680}, dinner:{items:"Kıymalı biber dolması (pilav az), yoğurt",portions:"4 dolma, 100g yoğurt",calories:580}, snack:{items:"Yoğurt, granola, çilek",portions:"200g yoğurt, 3 kaşık granola, 80g çilek",calories:290} }, total_calories:2180 },
    { day:27, meals:{ breakfast:{items:"4 yumurta sahanda, domates, peynir, tam ekmek",portions:"4 yumurta, 2 domates, 30g peynir, 2 dilim ekmek",calories:580}, lunch:{items:"Izgara somon, sebzeli bulgur",portions:"200g somon, 8 kaşık bulgur, sebze",calories:720}, dinner:{items:"Mercimek çorbası, kıymalı ekmek, yoğurt",portions:"2 su bardağı çorba, 2 dilim ekmek, 60g kıyma, 100g yoğurt",calories:620}, snack:{items:"Süt, 2 haşlanmış yumurta, badem",portions:"250ml süt, 2 yumurta, 15g badem",calories:300} }, total_calories:2220 },
    { day:28, meals:{ breakfast:{items:"Yulaf-muz-fıstık ezmesi-süt karışımı",portions:"6 kaşık yulaf, 1 muz, 1 kaşık fıstık ezmesi, 200ml süt",calories:580}, lunch:{items:"Tavuk göğsü fırında, pirinç pilavı, salata",portions:"200g tavuk, 7 kaşık pilav, büyük tabak salata",calories:680}, dinner:{items:"Dana kıymalı sebze yemeği, bulgur",portions:"80g kıyma, 1 su bardağı sebze, 7 kaşık bulgur",calories:620}, snack:{items:"Yoğurt, badem, elma",portions:"200g yoğurt, 20g badem, 1 elma",calories:290} }, total_calories:2170 },
    { day:29, meals:{ breakfast:{items:"4 omlet (peynir, biber, domates), ekmek",portions:"4 yumurta, 30g peynir, 2 biber, 1 domates, 2 dilim ekmek",calories:620}, lunch:{items:"Izgara köfte, bulgur, yeşil salata, cacık",portions:"5 köfte (250g), 7 kaşık bulgur, tabak salata, 100g cacık",calories:720}, dinner:{items:"Tavuk çorbası, nohutlu ıspanak",portions:"2 su bardağı çorba, 1 su bardağı nohut, 1 su bardağı ıspanak",calories:560}, snack:{items:"Süt, muz, fındık",portions:"250ml süt, 1 muz, 15g fındık",calories:300} }, total_calories:2200 },
    { day:30, meals:{ breakfast:{items:"Yulaf ezmesi, süt, 4 haşlanmış yumurta, muz",portions:"6 kaşık yulaf, 200ml süt, 4 yumurta, 1 muz",calories:640}, lunch:{items:"Fırın somon, pilav, brokoli",portions:"200g somon, 7 kaşık pilav, 1,5 su bardağı brokoli",calories:720}, dinner:{items:"Tavuk şiş, sebzeli bulgur, yoğurt",portions:"200g tavuk, 7 kaşık bulgur, 150g yoğurt",calories:640}, snack:{items:"Yoğurt-granola-muz-badem karışımı",portions:"200g yoğurt, 3 kaşık granola, yarım muz, 20g badem",calories:320} }, total_calories:2320 },
  ]
};

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function DietTracker() {
  const [activePerson, setActivePerson] = useState("didem");
  const [selectedDay, setSelectedDay] = useState(1);
  const [view, setView] = useState("day"); // "day" | "calendar"
  const [expandedMeal, setExpandedMeal] = useState(null);
  const theme = THEMES[activePerson];
  const data = DIET_DATA[activePerson];
  const dayData = data[selectedDay - 1];

  const today = new Date().getDate();
  const currentDayInMonth = Math.min(today, 30);

  useEffect(() => {
    setSelectedDay(1);
    setExpandedMeal(null);
  }, [activePerson]);

  const totalCals = dayData.total_calories;
  const maxCals = activePerson === "didem" ? 1600 : 2400;
  const minCals = activePerson === "didem" ? 1300 : 2000;
  const calPct = Math.min(100, ((totalCals - minCals) / (maxCals - minCals)) * 100);

  return (
    <div style={{
      minHeight: "100vh",
      background: theme.bg,
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      maxWidth: 480,
      margin: "0 auto",
      position: "relative",
      paddingBottom: 100,
    }}>
      {/* ── Header ── */}
      <div style={{
        background: theme.gradient,
        padding: "48px 24px 28px",
        position: "sticky", top: 0, zIndex: 50,
        boxShadow: `0 4px 24px ${theme.primary}40`,
      }}>
        {/* Person Switch */}
        <div style={{
          display: "flex", background: "rgba(255,255,255,0.22)",
          borderRadius: 40, padding: 4, marginBottom: 20,
        }}>
          {["didem", "murat"].map(p => (
            <button key={p} onClick={() => setActivePerson(p)} style={{
              flex: 1, padding: "10px 0",
              borderRadius: 36, border: "none", cursor: "pointer",
              fontWeight: 700, fontSize: 15, letterSpacing: 0.3,
              background: activePerson === p ? "#fff" : "transparent",
              color: activePerson === p ? THEMES[p].primary : "rgba(255,255,255,0.85)",
              transition: "all 0.25s",
              boxShadow: activePerson === p ? "0 2px 12px rgba(0,0,0,0.12)" : "none",
            }}>
              {THEMES[p].emoji} {THEMES[p].name}
            </button>
          ))}
        </div>

        {/* Profile row */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 52, height: 52, borderRadius: "50%",
            background: "rgba(255,255,255,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 26,
          }}>{theme.emoji}</div>
          <div style={{ flex: 1 }}>
            <div style={{ color: "#fff", fontWeight: 800, fontSize: 20 }}>{theme.name}</div>
            <div style={{ color: "rgba(255,255,255,0.82)", fontSize: 13 }}>{theme.goal} · {theme.target}</div>
          </div>
          <div style={{
            background: "rgba(255,255,255,0.22)", borderRadius: 14,
            padding: "6px 12px", color: "#fff", fontSize: 12, fontWeight: 600,
          }}>{theme.calRange}</div>
        </div>

        {/* View toggle */}
        <div style={{
          display: "flex", gap: 8, marginTop: 18,
        }}>
          {[["day", "📋 Günlük"], ["calendar", "📅 Takvim"]].map(([v, label]) => (
            <button key={v} onClick={() => setView(v)} style={{
              padding: "8px 18px", borderRadius: 20, border: "none", cursor: "pointer",
              background: view === v ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.18)",
              color: view === v ? theme.primary : "#fff",
              fontWeight: 700, fontSize: 13, transition: "all 0.2s",
            }}>{label}</button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ padding: "20px 16px" }}>
        {view === "calendar" ? (
          <CalendarView data={data} selectedDay={selectedDay} setSelectedDay={d => { setSelectedDay(d); setView("day"); }} theme={theme} />
        ) : (
          <DayView dayData={dayData} selectedDay={selectedDay} theme={theme} expandedMeal={expandedMeal} setExpandedMeal={setExpandedMeal} totalCals={totalCals} calPct={calPct} minCals={minCals} maxCals={maxCals} />
        )}
      </div>

      {/* ── Bottom Nav ── */}
      {view === "day" && (
        <div style={{
          position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
          width: "100%", maxWidth: 480,
          background: "#fff", borderTop: `1px solid ${theme.secondary}40`,
          padding: "12px 24px 20px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          boxShadow: "0 -4px 20px rgba(0,0,0,0.07)",
        }}>
          <button onClick={() => setSelectedDay(d => Math.max(1, d - 1))} disabled={selectedDay === 1} style={{
            width: 44, height: 44, borderRadius: "50%", border: "none",
            background: selectedDay === 1 ? "#eee" : theme.light,
            color: selectedDay === 1 ? "#bbb" : theme.primary,
            fontSize: 20, cursor: selectedDay === 1 ? "default" : "pointer",
            fontWeight: 700,
          }}>‹</button>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontWeight: 800, fontSize: 18, color: theme.text }}>Gün {selectedDay}</div>
            <div style={{ fontSize: 12, color: theme.subtext }}>30 günlük plan</div>
          </div>
          <button onClick={() => setSelectedDay(d => Math.min(30, d + 1))} disabled={selectedDay === 30} style={{
            width: 44, height: 44, borderRadius: "50%", border: "none",
            background: selectedDay === 30 ? "#eee" : theme.light,
            color: selectedDay === 30 ? "#bbb" : theme.primary,
            fontSize: 20, cursor: selectedDay === 30 ? "default" : "pointer",
            fontWeight: 700,
          }}>›</button>
        </div>
      )}
    </div>
  );
}

// ─── DAY VIEW ─────────────────────────────────────────────────────────────────
function DayView({ dayData, selectedDay, theme, expandedMeal, setExpandedMeal, totalCals, calPct, minCals, maxCals }) {
  return (
    <>
      {/* Calorie Summary Card */}
      <div style={{
        background: theme.calGradient,
        borderRadius: 20, padding: "20px 20px 18px",
        marginBottom: 16, border: `1px solid ${theme.secondary}30`,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 13, color: theme.subtext, fontWeight: 600, marginBottom: 4 }}>Günlük Kalori</div>
            <div style={{ fontSize: 36, fontWeight: 900, color: theme.primary, lineHeight: 1 }}>{totalCals.toLocaleString()}</div>
            <div style={{ fontSize: 12, color: theme.subtext, marginTop: 4 }}>kcal · Hedef: {minCals}–{maxCals}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 12, color: theme.subtext, fontWeight: 600 }}>GÜN</div>
            <div style={{ fontSize: 32, fontWeight: 900, color: theme.accent }}>{selectedDay}</div>
            <div style={{ fontSize: 11, color: theme.subtext }}>/30</div>
          </div>
        </div>
        {/* Progress bar */}
        <div style={{ marginTop: 14, background: "rgba(255,255,255,0.6)", borderRadius: 8, height: 8, overflow: "hidden" }}>
          <div style={{
            height: "100%", width: `${calPct}%`,
            background: theme.gradient, borderRadius: 8,
            transition: "width 0.5s ease",
          }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
          <span style={{ fontSize: 10, color: theme.subtext }}>{minCals} kcal</span>
          <span style={{ fontSize: 10, color: theme.subtext }}>{maxCals} kcal</span>
        </div>
      </div>

      {/* Meals */}
      {Object.entries(dayData.meals).map(([mealKey, meal]) => {
        const isExpanded = expandedMeal === mealKey;
        return (
          <div key={mealKey} onClick={() => setExpandedMeal(isExpanded ? null : mealKey)} style={{
            background: "#fff",
            borderRadius: 18, padding: "16px 18px",
            marginBottom: 12,
            border: `2px solid ${isExpanded ? theme.primary : "transparent"}`,
            boxShadow: isExpanded ? `0 4px 20px ${theme.primary}20` : "0 2px 12px rgba(0,0,0,0.06)",
            cursor: "pointer", transition: "all 0.2s",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 14,
                background: isExpanded ? theme.gradient : theme.light,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 22, flexShrink: 0,
                transition: "all 0.2s",
              }}>{MEAL_ICONS[mealKey]}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 16, color: theme.text }}>{MEAL_LABELS[mealKey]}</div>
                <div style={{ fontSize: 13, color: theme.subtext, marginTop: 2, lineHeight: 1.3 }}>{meal.items}</div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 16, color: theme.primary }}>{meal.calories}</div>
                <div style={{ fontSize: 10, color: theme.subtext }}>kcal</div>
              </div>
            </div>
            {isExpanded && (
              <div style={{
                marginTop: 14, paddingTop: 14,
                borderTop: `1px dashed ${theme.secondary}50`,
                animation: "fadeIn 0.2s ease",
              }}>
                <div style={{ fontSize: 12, color: theme.subtext, fontWeight: 600, marginBottom: 6 }}>📏 Porsiyonlar</div>
                <div style={{
                  fontSize: 14, color: theme.text, lineHeight: 1.6,
                  background: theme.light, borderRadius: 12, padding: "10px 14px",
                }}>{meal.portions}</div>
              </div>
            )}
          </div>
        );
      })}

      {/* Tip */}
      <div style={{
        background: "#fff", borderRadius: 16, padding: "14px 16px",
        border: `1px solid ${theme.light}`,
        display: "flex", gap: 10, alignItems: "flex-start",
        marginTop: 4,
      }}>
        <span style={{ fontSize: 20 }}>💡</span>
        <div style={{ fontSize: 13, color: theme.subtext, lineHeight: 1.5 }}>
          Detayları görmek için öğün kartına tıklayın. Porsiyonlar gerçekçi ve evde uygulanabilir ölçülerdedir.
        </div>
      </div>
    </>
  );
}

// ─── CALENDAR VIEW ────────────────────────────────────────────────────────────
function CalendarView({ data, selectedDay, setSelectedDay, theme }) {
  const days = Array.from({ length: 30 }, (_, i) => i + 1);
  const weekLabels = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

  return (
    <div>
      <div style={{ fontWeight: 800, fontSize: 18, color: theme.text, marginBottom: 16, paddingLeft: 4 }}>
        📅 30 Günlük Takvim
      </div>

      {/* Week labels */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 4 }}>
        {weekLabels.map(d => (
          <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: theme.subtext, padding: "4px 0" }}>{d}</div>
        ))}
      </div>

      {/* Days grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
        {/* offset for starting on Tuesday (index 1) */}
        <div />
        {days.map(d => {
          const dayData = data[d - 1];
          const cals = dayData.total_calories;
          const isSelected = d === selectedDay;
          const maxCals = theme.name === "Didem" ? 1600 : 2400;
          const intensity = Math.min(1, (cals / maxCals));
          return (
            <button key={d} onClick={() => setSelectedDay(d)} style={{
              aspectRatio: "1/1",
              borderRadius: 12, border: "none", cursor: "pointer",
              background: isSelected ? theme.primary : `${theme.primary}${Math.round(intensity * 40 + 12).toString(16).padStart(2, "0")}`,
              color: isSelected ? "#fff" : theme.text,
              fontWeight: isSelected ? 800 : 600,
              fontSize: 14,
              transition: "all 0.15s",
              transform: isSelected ? "scale(1.12)" : "scale(1)",
              boxShadow: isSelected ? `0 4px 16px ${theme.primary}50` : "none",
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 1,
              padding: "6px 2px",
            }}>
              <span>{d}</span>
              <span style={{ fontSize: 8, opacity: 0.75, fontWeight: 500 }}>{cals}</span>
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8, marginTop: 16,
        padding: "12px 16px", background: "#fff", borderRadius: 14,
        fontSize: 12, color: theme.subtext,
      }}>
        <div style={{ width: 12, height: 12, borderRadius: 4, background: `${theme.primary}22` }} />
        <span>Düşük kalori</span>
        <div style={{ width: 12, height: 12, borderRadius: 4, background: theme.primary, marginLeft: 8 }} />
        <span>Seçili gün</span>
        <div style={{ marginLeft: "auto", fontWeight: 700, color: theme.primary }}>
          Gün {selectedDay} seçili
        </div>
      </div>

      {/* Quick preview of selected day */}
      <div style={{
        marginTop: 16, background: "#fff", borderRadius: 18, padding: "16px 18px",
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
      }}>
        <div style={{ fontWeight: 800, color: theme.text, marginBottom: 12, fontSize: 15 }}>
          📋 Gün {selectedDay} · {data[selectedDay-1].total_calories} kcal
        </div>
        {Object.entries(data[selectedDay - 1].meals).map(([key, meal]) => (
          <div key={key} style={{
            display: "flex", gap: 10, alignItems: "center",
            padding: "8px 0", borderBottom: `1px solid ${theme.light}`,
          }}>
            <span style={{ fontSize: 18, width: 28 }}>{MEAL_ICONS[key]}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: theme.text }}>{MEAL_LABELS[key]}</div>
              <div style={{ fontSize: 12, color: theme.subtext }}>{meal.items.split(",")[0]}...</div>
            </div>
            <div style={{ fontWeight: 700, fontSize: 13, color: theme.primary }}>{meal.calories} kcal</div>
          </div>
        ))}
        <button onClick={() => setSelectedDay(selectedDay)} style={{
          marginTop: 14, width: "100%", padding: "12px 0",
          background: theme.gradient, border: "none", borderRadius: 14,
          color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer",
        }}>
          Tam Detayı Gör →
        </button>
      </div>
    </div>
  );
}
