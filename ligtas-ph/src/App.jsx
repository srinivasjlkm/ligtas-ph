import { useState, useRef, useEffect } from "react";

// ─────────────────────────────────────────────────────────────────
// DESIGN DIRECTION
// Apple visionOS / iOS 18 aesthetic: deep space blur backgrounds,
// frosted-glass cards with rgba white layering, SF Pro-style type,
// vibrancy-aware text, liquid spring transitions.
// Signature element: the entire UI floats on a living gradient
// mesh that shifts hue per disaster — like the Lock Screen wallpaper.
// ─────────────────────────────────────────────────────────────────

const font = "-apple-system, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', sans-serif";

// ─── Language Registry ─────────────────────────────────────────
// Structure: EN (English) / PH (tap to pick a Philippine language).
// Tagalog is the default PH language. 10 PH languages total are fully
// translated for all disaster survival content — the rest of the ~20
// most-spoken PH languages are represented in the picker with UI-level
// support and will fall back to Tagalog for long-form survival tips
// until fully translated (clearly flagged in the picker as "UI only").
const PH_LANGS = [
  { code:"tl", label:"Tagalog",     native:"Tagalog",      full:true  },
  { code:"ceb",label:"Cebuano",     native:"Bisaya/Cebuano",full:true  },
  { code:"ilo",label:"Ilocano",     native:"Ilokano",       full:true  },
  { code:"hil",label:"Hiligaynon",  native:"Ilonggo",       full:true  },
  { code:"bik",label:"Bikol",       native:"Bikol",         full:true  },
  { code:"war",label:"Waray",       native:"Waray-Waray",   full:true  },
  { code:"pam",label:"Kapampangan", native:"Kapampangan",   full:true  },
  { code:"pag",label:"Pangasinan",  native:"Pangasinense",  full:true  },
  { code:"mag",label:"Maguindanaon",native:"Maguindanaon",  full:true  },
  { code:"tsg",label:"Tausug",      native:"Tausug",        full:true  },
  // UI-only for now — fall back to Tagalog for disaster survival content.
  { code:"krn",label:"Kinaray-a",   native:"Kinaray-a",     full:false },
  { code:"mrw",label:"Maranao",     native:"Maranao",       full:false },
  { code:"akl",label:"Akeanon",     native:"Akeanon",       full:false },
  { code:"cbk",label:"Chavacano",   native:"Chavacano",     full:false },
  { code:"ibg",label:"Ibanag",      native:"Ibanag",        full:false },
  { code:"sgd",label:"Surigaonon",  native:"Surigaonon",    full:false },
  { code:"tbw",label:"Tagbanwa",    native:"Tagbanwa",      full:false },
  { code:"yka",label:"Yakan",       native:"Yakan",         full:false },
  { code:"bgo",label:"Butuanon",    native:"Butuanon",      full:false },
  { code:"smb",label:"Sambal",      native:"Sambal",        full:false },
];
// Languages with full disaster-content translation (used for fallback logic)
const FULL_LANGS = new Set(PH_LANGS.filter(l=>l.full).map(l=>l.code));
function contentLang(code) { return FULL_LANGS.has(code) ? code : "tl"; }

// Glassmorphism primitives
const glass = {
  card:       "rgba(255,255,255,0.08)",
  cardHover:  "rgba(255,255,255,0.13)",
  cardActive: "rgba(255,255,255,0.16)",
  border:     "rgba(255,255,255,0.12)",
  borderHi:   "rgba(255,255,255,0.22)",
  input:      "rgba(255,255,255,0.07)",
  nav:        "rgba(10,12,20,0.72)",
  pill:       "rgba(255,255,255,0.14)",
  pillBorder: "rgba(255,255,255,0.18)",
  white:      "#FFFFFF",
  textPrimary:"rgba(255,255,255,0.95)",
  textSecond: "rgba(255,255,255,0.60)",
  textTertiary:"rgba(255,255,255,0.35)",
};

// Disaster accent hues — used for mesh gradient tint
const MESH = {
  home:      ["#0a0e1a","#0d1f3a","#0e2244"],
  bagyo:     ["#071428","#0d2a55","#0a3070"],
  lindol:    ["#1a0e08","#2e1a0d","#3a1f0a"],
  bulkan:    ["#1a0808","#2e0f0d","#3a150a"],
  baha:      ["#071828","#0a2240","#0c2a52"],
  tsunami:   ["#051a16","#082a22","#0a3328"],
  landslide: ["#14100a","#221a0d","#2a1f0a"],
  gobag:     ["#0a0e1a","#0d1a30","#0e1e38"],
  hotlines:  ["#1a080e","#2a0d14","#2e0f18"],
  evac:      ["#080e1a","#0d1a2e","#0a1e38"],
};

const DCOLORS = {
  bagyo:     {h:"#4A9EFF", hd:"rgba(74,158,255,0.18)", text:"#80BDFF"},
  lindol:    {h:"#C47A3A", hd:"rgba(196,122,58,0.18)",  text:"#DFA060"},
  bulkan:    {h:"#E05C30", hd:"rgba(224,92,48,0.18)",   text:"#F07A50"},
  baha:      {h:"#3A9ECC", hd:"rgba(58,158,204,0.18)",  text:"#60BCEE"},
  tsunami:   {h:"#30BFA0", hd:"rgba(48,191,160,0.18)",  text:"#50DFC0"},
  landslide: {h:"#AA8840", hd:"rgba(170,136,64,0.18)",  text:"#CCA850"},
};

// ─── i18n ─────────────────────────────────────────────────────────
const T = {
  en: {
    appTagline:"Always Offline · No Data Collected",
    heroBanner:"Works without internet. Built for every Filipino.",
    sectionLabel:"Disasters",
    dailyTipTitle:"Reminder",
    dailyTip:"The best preparation happens <b>before</b> disaster strikes. Restock your go-bag every June when typhoon season begins.",
    tabAlert:"Alerts", tabBefore:"Before", tabDuring:"During", tabAfter:"After",
    backBtn:"Back",
    gobagReady:"packed", gobagDone:"Go-bag complete",
    gobagAddPlaceholder:"Add an item…", gobagAddBtn:"Add",
    gobagEditBtn:"Edit", gobagDoneEditBtn:"Done",
    hotlineWarning:"Save these numbers now — before you need them.",
    meetingTitle:"Family Meeting Point",
    meetingDesc:"Agree on a place to reunite if separated during a disaster — your barangay hall, a neighbor's home, or the nearest school.",
    navHome:"Disasters", navGobag:"Go-Bag", navHotlines:"Hotlines", navEvac:"Safe Zones",
    evacHowTitle:"About this list",
    evacHowBody:"Pre-loaded centers across all Philippine regions. Add your own barangay center below — stored on your device, no internet needed.",
    evacSearchPlaceholder:"Search city or center name…",
    evacMyTitle:"My Centers",
    evacMyEmpty:"No saved centers yet.",
    evacMyAddBtn:"Add Center",
    evacMyNamePlaceholder:"Center name",
    evacMyAddressPlaceholder:"Address or landmark",
    evacMyNotesPlaceholder:"Notes",
    evacSaveBtn:"Save", evacCancelBtn:"Cancel",
    evacGovLabel:"Gov't listed",
    evacUserLabel:"Saved",
    evacDisclaimer:"Confirm with your barangay DRRMC for latest designated centers.",
    langPickerTitle:"Choose Language", langPickerNote:"UI translated · survival tips shown in Tagalog",
  },
  tl: {
    appTagline:"Laging Offline · Walang Data na Kinokolekta",
    heroBanner:"Gumagana nang walang internet. Para sa bawat Pilipino.",
    sectionLabel:"Mga Kalamidad",
    dailyTipTitle:"Paalala",
    dailyTip:"Ang pinakamabisang paghahanda ay ginagawa <b>bago pa man</b> dumating ang sakuna. I-restock ang go-bag tuwing Hunyo.",
    tabAlert:"Alert", tabBefore:"Bago", tabDuring:"Habang", tabAfter:"Pagkatapos",
    backBtn:"Bumalik",
    gobagReady:"handa", gobagDone:"Go-bag handa na",
    gobagAddPlaceholder:"Magdagdag ng aytem…", gobagAddBtn:"Idagdag",
    gobagEditBtn:"I-edit", gobagDoneEditBtn:"Tapos",
    hotlineWarning:"I-save ang mga numerong ito ngayon — bago mo pa kailanganin.",
    meetingTitle:"Family Meeting Point",
    meetingDesc:"Mag-usap tungkol sa lugar na magtatagpuan kung hindi kayo magkasama — barangay hall, bahay ng kapitbahay, o pinakamalapit na paaralan.",
    navHome:"Sakuna", navGobag:"Go-Bag", navHotlines:"Hotline", navEvac:"Safe Zones",
    evacHowTitle:"Tungkol sa listahan",
    evacHowBody:"Mga pre-loaded center sa buong Pilipinas. Idagdag ang sariling center ng inyong barangay — nakaimbak sa inyong telepono, offline.",
    evacSearchPlaceholder:"Hanapin ang lungsod o center…",
    evacMyTitle:"Aking mga Center",
    evacMyEmpty:"Wala pang naka-save na center.",
    evacMyAddBtn:"Idagdag",
    evacMyNamePlaceholder:"Pangalan ng center",
    evacMyAddressPlaceholder:"Address o landmark",
    evacMyNotesPlaceholder:"Mga tala",
    evacSaveBtn:"I-save", evacCancelBtn:"Kanselahin",
    evacGovLabel:"Gov't listed",
    evacUserLabel:"Na-save",
    evacDisclaimer:"Kumpirmahin sa inyong barangay DRRMC ang pinakabagong itinalagang mga center.",
    langPickerTitle:"Pumili ng Wika", langPickerNote:"Buong saklaw ng pagsasalin",
  },
  ceb: {
    appTagline:"Kanunay nga Offline · Walay Gikolekta nga Data",
    heroBanner:"Naglihok bisan walay internet. Hinimo alang sa tagsa ka Pilipino.",
    sectionLabel:"Mga Kalamidad",
    dailyTipTitle:"Pahinumdom",
    dailyTip:"Ang labing maayong pangandam himuon <b>sa dili pa</b> moabot ang kalamidad. I-restock ang go-bag kada Hunyo.",
    tabAlert:"Alerto", tabBefore:"Sa Wala Pa", tabDuring:"Atol", tabAfter:"Human",
    backBtn:"Balik",
    gobagReady:"andam na", gobagDone:"Kompleto na ang go-bag",
    gobagAddPlaceholder:"Pagdugang og butang…", gobagAddBtn:"Dugang",
    gobagEditBtn:"I-edit", gobagDoneEditBtn:"Tapos",
    hotlineWarning:"I-save kini nga mga numero karon — sa dili pa nimo kinahanglan.",
    meetingTitle:"Tigomanan sa Pamilya",
    meetingDesc:"Pag-uyon og lugar nga magtagbo kung mabulag mo panahon sa kalamidad — barangay hall, balay sa silingan, o duol nga eskwelahan.",
    navHome:"Kalamidad", navGobag:"Go-Bag", navHotlines:"Hotline", navEvac:"Luwas nga Lugar",
    evacHowTitle:"Mahitungod niini",
    evacHowBody:"Pre-loaded nga mga center sa tibuok Pilipinas. Idugang ang inyong barangay center sa ubos — gitipig sa inyong device, walay internet.",
    evacSearchPlaceholder:"Pangitaa ang siyudad o center…",
    evacMyTitle:"Akong mga Center",
    evacMyEmpty:"Walay pa na-save nga center.",
    evacMyAddBtn:"Dugang Center",
    evacMyNamePlaceholder:"Pangalan sa center",
    evacMyAddressPlaceholder:"Address o landmark",
    evacMyNotesPlaceholder:"Mga nota",
    evacSaveBtn:"I-save", evacCancelBtn:"Kanselar",
    evacGovLabel:"Gov't listed",
    evacUserLabel:"Na-save",
    evacDisclaimer:"Kumpirma sa inyong barangay DRRMC ang pinakabag-o nga mga center.",
    langPickerTitle:"Pilia ang Pinulongan", langPickerNote:"Kompleto nga hubad",
  },
  ilo: {
    appTagline:"Kanayon nga Offline · Awan Naala nga Datos",
    heroBanner:"Agtrabaho uray awan internet. Naaramid para iti tunggal Filipino.",
    sectionLabel:"Dagiti Kalamidad",
    dailyTipTitle:"Panangilagip",
    dailyTip:"Ti kasayaatan a panangisagana ket maaramid <b>sakbay</b> nga dumteng ti kalamidad. I-restock ti go-bag tunggal Hunio.",
    tabAlert:"Alerto", tabBefore:"Sakbay", tabDuring:"Bayat", tabAfter:"Kalpasan",
    backBtn:"Agsubli",
    gobagReady:"nakaisagana", gobagDone:"Kompleto ti go-bag",
    gobagAddPlaceholder:"Mangnayon iti banag…", gobagAddBtn:"Inayon",
    gobagEditBtn:"Urnosen", gobagDoneEditBtn:"Nalpas",
    hotlineWarning:"Idulin dagitoy a numero ita — sakbay a kasapulam.",
    meetingTitle:"Lugar a Pakigayamanan ti Pamilia",
    meetingDesc:"Agtunos iti lugar a pakigayamanan no maisina kabayatan ti kalamidad — barangay hall, balay ti kaarruba, wenno asideg nga eskuelaan.",
    navHome:"Kalamidad", navGobag:"Go-Bag", navHotlines:"Hotline", navEvac:"Natalged a Lugar",
    evacHowTitle:"Maipanggep iti daytoy",
    evacHowBody:"Pre-loaded a sentro iti intero Filipinas. Inayon ti barangay center iti baba — naidulin iti device mo, awan internet.",
    evacSearchPlaceholder:"Sapulen ti siudad wenno center…",
    evacMyTitle:"Dagiti Senteroko",
    evacMyEmpty:"Awan pay naidulin a sentro.",
    evacMyAddBtn:"Inayon Sentro",
    evacMyNamePlaceholder:"Nagan ti sentro",
    evacMyAddressPlaceholder:"Address wenno landmark",
    evacMyNotesPlaceholder:"Dagiti nota",
    evacSaveBtn:"Idulin", evacCancelBtn:"Ukasen",
    evacGovLabel:"Gov't listed",
    evacUserLabel:"Naidulin",
    evacDisclaimer:"Kumpirmaen iti barangay DRRMC dagiti kaudian a naituding a sentro.",
    langPickerTitle:"Agpili iti Pagsasao", langPickerNote:"Kompleto a patarus",
  },
  hil: {
    appTagline:"Pirme Offline · Wala'y Ginkuha nga Datos",
    heroBanner:"Nagaobra bisan wala internet. Ginhimo para sa tagsa ka Pilipino.",
    sectionLabel:"Mga Kalamidad",
    dailyTipTitle:"Pahanumdom",
    dailyTip:"Ang pinakamaayo nga pagpreparar ginahimo <b>antes</b> mag-abot ang kalamidad. I-restock ang go-bag kada Hunyo.",
    tabAlert:"Alerto", tabBefore:"Antes", tabDuring:"Samtang", tabAfter:"Pagkatapos",
    backBtn:"Balik",
    gobagReady:"handa na", gobagDone:"Kompleto na ang go-bag",
    gobagAddPlaceholder:"Dugang sang butang…", gobagAddBtn:"Dugang",
    gobagEditBtn:"I-edit", gobagDoneEditBtn:"Tapos",
    hotlineWarning:"I-save ini nga mga numero subong — antes mo kinahanglanon.",
    meetingTitle:"Lugar nga Magtagboan sang Pamilya",
    meetingDesc:"Mag-uyon sa lugar nga magtagboan kon mabulag kamo sa tion sang kalamidad — barangay hall, balay sang kaingod, ukon malapit nga eskwelahan.",
    navHome:"Kalamidad", navGobag:"Go-Bag", navHotlines:"Hotline", navEvac:"Lugar nga Talalupangdan",
    evacHowTitle:"Parte sini",
    evacHowBody:"Pre-loaded nga mga center sa tibuok Pilipinas. Idugang ang inyo barangay center sa idalom — natipigan sa inyo device, wala internet.",
    evacSearchPlaceholder:"Pangitaa ang syudad ukon center…",
    evacMyTitle:"Akon mga Center",
    evacMyEmpty:"Wala pa sang na-save nga center.",
    evacMyAddBtn:"Dugang Center",
    evacMyNamePlaceholder:"Ngalan sang center",
    evacMyAddressPlaceholder:"Address ukon landmark",
    evacMyNotesPlaceholder:"Mga nota",
    evacSaveBtn:"I-save", evacCancelBtn:"Kanselar",
    evacGovLabel:"Gov't listed",
    evacUserLabel:"Na-save",
    evacDisclaimer:"Kumpirma sa inyo barangay DRRMC ang pinakabag-o nga mga center.",
    langPickerTitle:"Pilia ang Lenguahe", langPickerNote:"Kompleto nga translation",
  },
  bik: {
    appTagline:"Pirmeng Offline · Mayong Nakuang Datos",
    heroBanner:"Naghihiro maski mayong internet. Ginibo para sa lambang Pilipino.",
    sectionLabel:"Mga Kalamidad",
    dailyTipTitle:"Pagirumdom",
    dailyTip:"An pinakamarahay na pag-andam ginigibo <b>bago</b> umabot an kalamidad. I-restock an go-bag kada Hunyo.",
    tabAlert:"Alerto", tabBefore:"Bago", tabDuring:"Habang", tabAfter:"Pagkatapos",
    backBtn:"Bumalik",
    gobagReady:"andam na", gobagDone:"Kompleto na an go-bag",
    gobagAddPlaceholder:"Magdugang nin butang…", gobagAddBtn:"Idugang",
    gobagEditBtn:"I-edit", gobagDoneEditBtn:"Tapos",
    hotlineWarning:"I-save an mga numero na ini ngonyan — bago mo ini kaipuhan.",
    meetingTitle:"Lugar na Pagtiripunan kan Pamilya",
    meetingDesc:"Mag-ulay kun saen magkikiparaan kun maseparar kamo durante kan kalamidad — barangay hall, harong kan kataed, o harani na eskwelahan.",
    navHome:"Kalamidad", navGobag:"Go-Bag", navHotlines:"Hotline", navEvac:"Ligtas na Lugar",
    evacHowTitle:"Manungod kaini",
    evacHowBody:"Pre-loaded na mga center sa bilog na Pilipinas. Idugang an saimong barangay center sa ibaba — naka-imbak sa device mo, mayong internet.",
    evacSearchPlaceholder:"Hanapon an siyudad o center…",
    evacMyTitle:"Mga Center Ko",
    evacMyEmpty:"Mayo pang na-save na center.",
    evacMyAddBtn:"Idugang Center",
    evacMyNamePlaceholder:"Pangaran kan center",
    evacMyAddressPlaceholder:"Address o landmark",
    evacMyNotesPlaceholder:"Mga nota",
    evacSaveBtn:"I-save", evacCancelBtn:"Kanselaron",
    evacGovLabel:"Gov't listed",
    evacUserLabel:"Na-save",
    evacDisclaimer:"Kumpirmaron sa saindong barangay DRRMC an pinakabagong mga center.",
    langPickerTitle:"Pumili nin Lenguahe", langPickerNote:"Kompletong pagsasalin",
  },
  war: {
    appTagline:"Pirme Offline · Waray Nakukuha nga Datos",
    heroBanner:"Naglalakat bisan waray internet. Ginhimo para han kada Filipino.",
    sectionLabel:"Mga Kalamidad",
    dailyTipTitle:"Pahinumdom",
    dailyTip:"An pinakamaupay nga pag-andam ginhihimo <b>antes</b> umabot an kalamidad. I-restock an go-bag kada Hunyo.",
    tabAlert:"Alerto", tabBefore:"Antes", tabDuring:"Samtang", tabAfter:"Katapusan",
    backBtn:"Balik",
    gobagReady:"andam na", gobagDone:"Kompleto na an go-bag",
    gobagAddPlaceholder:"Dugang hin butang…", gobagAddBtn:"Idugang",
    gobagEditBtn:"I-edit", gobagDoneEditBtn:"Tapos",
    hotlineWarning:"I-save ini nga mga numero yana — antes mo ini kinahanglanon.",
    meetingTitle:"Lugar nga Magkikitaan han Pamilya",
    meetingDesc:"Pag-uyon hin lugar nga magkikitaan kun mabulag kamo durante han kalamidad — barangay hall, balay han kasilingan, o duok nga eskwelahan.",
    navHome:"Kalamidad", navGobag:"Go-Bag", navHotlines:"Hotline", navEvac:"Salipdan nga Lugar",
    evacHowTitle:"Mahitungod hini",
    evacHowBody:"Pre-loaded nga mga center ha bug-os nga Pilipinas. Idugang an iyo barangay center ha ubos — natipigan ha iyo device, waray internet.",
    evacSearchPlaceholder:"Pamilngi an syudad o center…",
    evacMyTitle:"Mga Center Ko",
    evacMyEmpty:"Waray pa na-save nga center.",
    evacMyAddBtn:"Idugang Center",
    evacMyNamePlaceholder:"Ngaran han center",
    evacMyAddressPlaceholder:"Address o landmark",
    evacMyNotesPlaceholder:"Mga nota",
    evacSaveBtn:"I-save", evacCancelBtn:"Kanselara",
    evacGovLabel:"Gov't listed",
    evacUserLabel:"Na-save",
    evacDisclaimer:"Kumpirmaha ha iyo barangay DRRMC an pinakabag-o nga mga center.",
    langPickerTitle:"Pumili hin Yinaknan", langPickerNote:"Kompleto nga hubad",
  },
  pam: {
    appTagline:"Lagi Offline · Alang Dakuang Data",
    heroBanner:"Gumagana agnan ala internet. Gewa para king balang Filipino.",
    sectionLabel:"Dagul Kalamidad",
    dailyTipTitle:"Pamanumdaman",
    dailyTip:"Ing pekamayap a pamipaganap gewa <b>bayu</b> datnan ing kalamidad. I-restock ing go-bag balang Hunyo.",
    tabAlert:"Alerto", tabBefore:"Bayu", tabDuring:"Samantala", tabAfter:"Kaibat",
    backBtn:"Balik",
    gobagReady:"makasanaya", gobagDone:"Kumpletu ne ing go-bag",
    gobagAddPlaceholder:"Magdagdag ning gamit…", gobagAddBtn:"Idagdag",
    gobagEditBtn:"I-edit", gobagDoneEditBtn:"Tapus",
    hotlineWarning:"I-save deng numerung ini ngeni — bayu mu kailangan.",
    meetingTitle:"Lugal a Pisalubungan na Pamilya",
    meetingDesc:"Mag-isipan king lugal a pisalubungan istung mibulag kayu king panaun ning kalamidad — barangay hall, bale na kapitbahay, o malapit a eskwelahan.",
    navHome:"Kalamidad", navGobag:"Go-Bag", navHotlines:"Hotline", navEvac:"Maligtas a Lugal",
    evacHowTitle:"Tungkul kanini",
    evacHowBody:"Pre-loaded a centro king kabuuan ning Filipinas. Idagdag ing kekayung barangay center king lalam — atilan king kekayung device, alang internet.",
    evacSearchPlaceholder:"Anapan ing siudad o center…",
    evacMyTitle:"Dagul Centro Ku",
    evacMyEmpty:"Alang pa center a na-save.",
    evacMyAddBtn:"Idagdag Centro",
    evacMyNamePlaceholder:"Lagyu ning centro",
    evacMyAddressPlaceholder:"Address o landmark",
    evacMyNotesPlaceholder:"Dagul nota",
    evacSaveBtn:"I-save", evacCancelBtn:"Kanselan",
    evacGovLabel:"Gov't listed",
    evacUserLabel:"Na-save",
    evacDisclaimer:"Kumpirman king kekayung barangay DRRMC deng paneng makabang centro.",
    langPickerTitle:"Pilinan ing Amanu", langPickerNote:"Kumpletung pamipalit",
  },
  pag: {
    appTagline:"Lawas Offline · Anggapo so Naala a Datos",
    heroBanner:"Manggagana anggan anggapo so internet. Ginawa parad amin a Filipino.",
    sectionLabel:"Saray Kalamidad",
    dailyTipTitle:"Pakanonotan",
    dailyTip:"Say pinakamaong a panagpaparaan gagawaen <b>antis</b> onsabi so kalamidad. I-restock so go-bag kada Hunyo.",
    tabAlert:"Alerto", tabBefore:"Antis", tabDuring:"Legan", tabAfter:"Kalabas",
    backBtn:"Pawil",
    gobagReady:"akaparaan la", gobagDone:"Kompleto la so go-bag",
    gobagAddPlaceholder:"Mangiyat na banar…", gobagAddBtn:"Iyat",
    gobagEditBtn:"I-edit", gobagDoneEditBtn:"Anggad",
    hotlineWarning:"I-save iray numero la natan — antis mo ya kaukolan.",
    meetingTitle:"Pasen na Pantitiponan na Pamilya",
    meetingDesc:"Mantongtong na pasen a pantitiponan no nibulagan kayo legan na kalamidad — barangay hall, abung na kaarayan, o asingger ya eskuelaan.",
    navHome:"Kalamidad", navGobag:"Go-Bag", navHotlines:"Hotline", navEvac:"Mareen a Pasen",
    evacHowTitle:"Nipaakar ed saya",
    evacHowBody:"Pre-loaded iran center ed interon Filipinas. Iyat so barangay center yo ed leksab — niimbak ed device yo, anggapo so internet.",
    evacSearchPlaceholder:"Anapen so syudad o center…",
    evacMyTitle:"Saray Center Ko",
    evacMyEmpty:"Anggapo ni so na-save a center.",
    evacMyAddBtn:"Iyat Center",
    evacMyNamePlaceholder:"Ngaran na center",
    evacMyAddressPlaceholder:"Address o landmark",
    evacMyNotesPlaceholder:"Saray nota",
    evacSaveBtn:"I-save", evacCancelBtn:"Ikansela",
    evacGovLabel:"Gov't listed",
    evacUserLabel:"Na-save",
    evacDisclaimer:"Kumpirmaen ed barangay DRRMC yo iray balon nituding a center.",
    langPickerTitle:"Manpili na Lenguahe", langPickerNote:"Kompleton patalos",
  },
  mag: {
    appTagline:"Tatap Offline · Daa Naala a Data",
    heroBanner:"Maghihimo minsan daa internet. Inadun para ka langun a Filipino.",
    sectionLabel:"Manga Kalamidad",
    dailyTipTitle:"Pananadem",
    dailyTip:"So mapiya a pananagana mababaloi <b>ko di pa</b> makaoma so kalamidad. Pakatademan so go-bag oman Hunyo.",
    tabAlert:"Alerto", tabBefore:"Ko Di Pa", tabDuring:"Ko Wakto", tabAfter:"Ko Maipos",
    backBtn:"Kambalingan",
    gobagReady:"miyasdiya", gobagDone:"Miyakapuro so go-bag",
    gobagAddPlaceholder:"Pamagoman sa makapal…", gobagAddBtn:"Idugang",
    gobagEditBtn:"Baguhin", gobagDoneEditBtn:"Maipos",
    hotlineWarning:"Idiyam so manga numero ini imanto — ko di pa nu kapuunan.",
    meetingTitle:"Darpa a Khatumoan o Pamilya",
    meetingDesc:"Pagayonayon sa darpa a khatumoan o masensila kano ko kawakto o kalamidad — barangay hall, walai o tonga, o marani a sekolaan.",
    navHome:"Kalamidad", navGobag:"Go-Bag", navHotlines:"Hotline", navEvac:"Mapiya a Darpa",
    evacHowTitle:"Mipantag ro'o",
    evacHowBody:"Pre-loaded a manga center ko kaped a Filipinas. Idugang so barangay center nu ko sirong — miyatago ko device nu, daa internet.",
    evacSearchPlaceholder:"Pangilaya so syudad o center…",
    evacMyTitle:"Manga Center Akun",
    evacMyEmpty:"Daa pen miyatigo a center.",
    evacMyAddBtn:"Idugang Center",
    evacMyNamePlaceholder:"Ngaran o center",
    evacMyAddressPlaceholder:"Address o landmark",
    evacMyNotesPlaceholder:"Manga nota",
    evacSaveBtn:"Idiyam", evacCancelBtn:"Kanselaren",
    evacGovLabel:"Gov't listed",
    evacUserLabel:"Miyatago",
    evacDisclaimer:"Kumpirmaa ko barangay DRRMC nu so pinakabago a manga center.",
    langPickerTitle:"Pamili sa Basa", langPickerNote:"Kaped a kapagintaw",
  },
  tsg: {
    appTagline:"Kanunay Offline · Wala' Da'on Kinawa nga Datos",
    heroBanner:"Maglihug minsan wala' internet. Hinimu para ha kada Pilipino.",
    sectionLabel:"Manga Kalamidad",
    dailyTipTitle:"Pamahinumdum",
    dailyTip:"In pinakamaupat nga pagtagamak hinhimu <b>ubus pa</b> sin pag-abut sin kalamidad. I-restock in go-bag kada Hunyo.",
    tabAlert:"Alerto", tabBefore:"Ubus Pa", tabDuring:"Ha Waktu", tabAfter:"Pag'ubus",
    backBtn:"Pabalik",
    gobagReady:"nahanda na", gobagDone:"Naka'umpul na in go-bag",
    gobagAddPlaceholder:"Dugang ha unu-unu…", gobagAddBtn:"Dugang",
    gobagEditBtn:"Baguha", gobagDoneEditBtn:"Tapus",
    hotlineWarning:"I-save in manga numero yan' bihaun — ubus pa mu kagunahanan.",
    meetingTitle:"Lugal Pagkitaan sin Pamilya",
    meetingDesc:"Mag'isun ha lugal pagkitaan bang kamu mabulag ha waktu sin kalamidad — barangay hall, bay sin kataymanghud, atawa malapit nga sikulahan.",
    navHome:"Kalamidad", navGobag:"Go-Bag", navHotlines:"Hotline", navEvac:"Sara nga Lugal",
    evacHowTitle:"Pasal sin yan'",
    evacHowBody:"Pre-loaded nga manga center ha katibuk-an sin Pilipinas. Dugangi in barangay center mu ha ibaba — nakatagu' ha device mu, wala' internet.",
    evacSearchPlaceholder:"Hambuuka in syudad atawa center…",
    evacMyTitle:"Manga Center Ku",
    evacMyEmpty:"Wala' pa nakatagu' nga center.",
    evacMyAddBtn:"Dugang Center",
    evacMyNamePlaceholder:"Ngan sin center",
    evacMyAddressPlaceholder:"Address atawa landmark",
    evacMyNotesPlaceholder:"Manga nota",
    evacSaveBtn:"Tagua'", evacCancelBtn:"Kansela",
    evacGovLabel:"Gov't listed",
    evacUserLabel:"Natagu'",
    evacDisclaimer:"Pakatantua ha barangay DRRMC niyu in pinakabagu nga manga center.",
    langPickerTitle:"Pilia in Bissara", langPickerNote:"Katibuk-an nga hubad",
  },
};

// ─── Data ─────────────────────────────────────────────────────────
const DISASTERS = [
  { id:"bagyo", icon:"🌀", name:{en:"Typhoon",tl:"Bagyo",ceb:"Bagyo",ilo:"Bagyo",hil:"Bagyo",bik:"Bagyo",war:"Bagyo",pam:"Bagyu",pag:"Bagyo",mag:"Bagyo",tsg:"Bagyu"},
    levels:{
      en:[{label:"Signal 1",desc:"Caution. Possible brownouts. Charge devices now."},{label:"Signal 2",desc:"Prepare go-bag. Locate nearest evacuation center."},{label:"Signal 3",desc:"Stay indoors. Exit only for emergencies."},{label:"Signal 4",desc:"Very dangerous. Follow all LGU and NDRRMC orders."},{label:"Signal 5",desc:"Catastrophic. Evacuate immediately."}],
      tl:[{label:"Signal 1",desc:"Maingat na pansin. Maaaring mag-brownout. I-charge ang mga device."},{label:"Signal 2",desc:"Ihanda ang go-bag. Alamin ang pinakamalapit na evacuation center."},{label:"Signal 3",desc:"Manatili sa bahay. Lumabas lamang kung emergency."},{label:"Signal 4",desc:"Lubhang mapanganib. Sundin ang lahat ng utos ng LGU at NDRRMC."},{label:"Signal 5",desc:"Katastropiko. Mag-evacuate agad."}],
      ceb:[{label:"Signal 1",desc:"Pag-amping. Posibling mawad-an og kuryente. I-charge na ang mga device."},{label:"Signal 2",desc:"Andama ang go-bag. Pangitaa ang duol nga evacuation center."},{label:"Signal 3",desc:"Pabilin sa sulod. Lakaw lang kung emergency."},{label:"Signal 4",desc:"Delikado kaayo. Sunda ang tanang sugo sa LGU ug NDRRMC."},{label:"Signal 5",desc:"Katalagman. Mag-evacuate dayon."}],
      ilo:[{label:"Signal 1",desc:"Agannad. Mabalin nga awan kuryente. I-charge dagiti gadyet ita."},{label:"Signal 2",desc:"Isagana ti go-bag. Sapulen ti kasingaasidegan nga evacuation center."},{label:"Signal 3",desc:"Agtalinaed iti uneg. Rummuar laeng no emergency."},{label:"Signal 4",desc:"Nakaru unay ti peggad. Surotem dagiti bilin ti LGU ken NDRRMC."},{label:"Signal 5",desc:"Katastrofiko. Agevacuate a dagus."}],
      hil:[{label:"Signal 1",desc:"Mag-andam. Posible mag-brownout. I-charge na ang mga gamit."},{label:"Signal 2",desc:"Handaa ang go-bag. Pangitaa ang pinakamalapit nga evacuation center."},{label:"Signal 3",desc:"Magpabilin sa sulod. Magluwas lang kon emergency."},{label:"Signal 4",desc:"Delikado gid. Sunda ang tanan nga sugo sang LGU kag NDRRMC."},{label:"Signal 5",desc:"Katalagman. Mag-evacuate dayon."}],
      bik:[{label:"Signal 1",desc:"Mag-ingat. Posibleng mawalat nin kuryente. I-charge na an mga gamit."},{label:"Signal 2",desc:"Andamon an go-bag. Hanapon an harani na evacuation center."},{label:"Signal 3",desc:"Magdanay sa lawom. Luwas sana kun emergency."},{label:"Signal 4",desc:"Delikado nanggad. Sunudon an gabos na orden kan LGU asin NDRRMC."},{label:"Signal 5",desc:"Katalagman. Mag-evacuate giraray."}],
      war:[{label:"Signal 1",desc:"Pag-andam. Posible mawad-an hin kuryente. I-charge yana an mga gamit."},{label:"Signal 2",desc:"Andama an go-bag. Bilngi an duok nga evacuation center."},{label:"Signal 3",desc:"Pabilin ha sulod. Lakat la kun emergency."},{label:"Signal 4",desc:"Delikado gud. Sunda an ngatanan nga sugo han LGU ngan NDRRMC."},{label:"Signal 5",desc:"Katalagman. Mag-evacuate dayon."}],
      pam:[{label:"Signal 1",desc:"Mag-ingat. Malyari mawalan kuryente. I-charge na ring gamit."},{label:"Signal 2",desc:"Isadya ing go-bag. Anapan ing malapit a evacuation center."},{label:"Signal 3",desc:"Manatili king kilub. Lual ya basta emergency."},{label:"Signal 4",desc:"Delikadu ya maluat. Sundan deng utus na LGU at NDRRMC."},{label:"Signal 5",desc:"Katastrofiku. Mag-evacuate agad."}],
      pag:[{label:"Signal 1",desc:"Manalwar. Nayarin anggapo so koryente. I-charge la natan iray gamit."},{label:"Signal 2",desc:"Iparaan so go-bag. Anapen so asingger ya evacuation center."},{label:"Signal 3",desc:"Manatili ed loob. Onla labat no emergency."},{label:"Signal 4",desc:"Mapeligro ya tuloy. Tumboken iray ganggan na LGU tan NDRRMC."},{label:"Signal 5",desc:"Katastropiko. Mag-evacuate la tampol."}],
      mag:[{label:"Signal 1",desc:"Pagingat. Mbaling kawang so kuryente. Pakatademi so manga gamit imanto."},{label:"Signal 2",desc:"Pakasdiyai so go-bag. Tuwi so marani a evacuation center."},{label:"Signal 3",desc:"Sa walai matatap. Lima ko bun kun emergency."},{label:"Signal 4",desc:"Mawatan a maito. Onotan so manga sogo o LGU ago NDRRMC."},{label:"Signal 5",desc:"Mala a kalamidad. Pangampang ko mapulu."}],
      tsg:[{label:"Signal 1",desc:"Pag-ingat. Mahimu mawala in kuryente. I-charge na in manga gamit."},{label:"Signal 2",desc:"Hikapsa in go-bag. Bilahanga in malapit nga evacuation center."},{label:"Signal 3",desc:"Pabilin ha lawum. Lakaw da bang emergency."},{label:"Signal 4",desc:"Hambuuk delikado. Tumana in manga sara' sin LGU iban NDRRMC."},{label:"Signal 5",desc:"Katalagman. Pag'alas dayon."}],
    },
    before:{
      en:["Charge all gadgets and power banks","Store water — 3-day supply per person","Prepare go-bag: ID, documents, medicine, food","Trim tree branches near your home","Know your barangay evacuation route"],
      tl:["I-charge ang lahat ng gadget at power banks","Mag-imbak ng tubig — 3 araw na supply per tao","Ihanda ang go-bag: ID, dokumento, gamot, pagkain","Putulin ang mga sanga ng puno malapit sa bahay","Alamin ang evacuation route ng inyong barangay"],
      ceb:["I-charge ang tanang gadget ug power banks","Tipigi ang tubig — 3 ka adlaw nga suplay sa tagsa","Andama ang go-bag: ID, dokumento, tambal, pagkaon","Putla ang mga sanga sa kahoy duol sa balay","Hibaloi ang evacuation route sa inyong barangay"],
      ilo:["I-charge dagiti amin a gadget ken power banks","Mangidulin iti danum — 3 nga aldaw a suplay iti tunggal maysa","Isagana ti go-bag: ID, dokumento, agas, taraon","Putdan dagiti sanga ti kayo nga asideg iti balay","Ammuen ti evacuation route ti barangay yo"],
      hil:["I-charge ang tanan nga gadget kag power banks","Tipigi ang tubig — 3 ka adlaw nga suplay sa kada isa","Handaa ang go-bag: ID, dokumento, bulong, pagkaon","Putla ang mga sanga sang kahoy malapit sa balay","Tun-i ang evacuation route sang inyo barangay"],
      bik:["I-charge an gabos na gadget asin power banks","Itago an tubig — 3 na aldaw na suplay sa kada saro","Andamon an go-bag: ID, dokumento, bulong, kakanon","Putlon an mga sanga kan kahoy harani sa harong","Maaraman an evacuation route kan saimong barangay"],
      war:["I-charge an ngatanan nga gadget ngan power banks","Tipigi an tubig — 3 ka adlaw nga suplay para han tagsa","Andama an go-bag: ID, dokumento, bulong, pagkaon","Putla an mga sanga han kahoy hirani han balay","Hibaroa an evacuation route han iyo barangay"],
      pam:["I-charge la ring sablang gadget at power banks","Magdimla ning danum — 3 aldo a suplay king tagsa","Isadya ing go-bag: ID, dokumento, gamut, pamangan","Tagpasan deng sanga ning dutung king malapit ning bale","Akilala ing evacuation route ning kekayung barangay"],
      pag:["I-charge la iray amin a gadget tan power banks","Mangiyimbak na danum — 3 ya agew a suplay ed kada sakey","Iparaan so go-bag: ID, dokumento, agas, naakan","Putdan iray sanga na kiew ya asingger ed abung","Amtaen so evacuation route na barangay yo"],
      mag:["Pakatademi so langun a gadget ago power banks","Tagoi so ig — 3 gawii a suplay ko oman isa","Pakasdiyai so go-bag: ID, dokumento, ubat, kanon","Putosi so manga sanga o kayo a marani ko walai","Kataw-i so evacuation route o barangay nu"],
      tsg:["I-charge in katibuk-an nga gadget iban power banks","Pagtipigi in tubig — 3 ka adlaw nga suplay ha kada isa","Hikapsa in go-bag: ID, dokumento, tambal, kakaun","Putla in manga sanga sin kahoy malapit ha bay","Kaingatan in evacuation route sin barangay niyu"],
    },
    during:{
      en:["Stay in the sturdiest room, away from windows","Don't go out during the eye — the calm is deceptive","Never cross floodwater — 6 inches can knock you down","Monitor PAGASA on radio — no internet needed","Storm surge warning? Evacuate to high ground immediately"],
      tl:["Manatili sa pinaka-matibay na silid, malayo sa bintana","Huwag lumabas habang nasa mata ng bagyo","Huwag tumawid sa baha — 6 pulgada lang ang sapat para matumba","I-monitor ang PAGASA sa radyo","Storm surge warning? Mag-evacuate agad"],
      ceb:["Pabilin sa pinaka-lig-on nga kuwarto, layo sa bintana","Ayaw pag-gawas samtang sa mata sa bagyo","Ayaw tabok sa baha — 6 pulgada ra makapatumba nimo","I-monitor ang PAGASA sa radyo","Storm surge warning? Mag-evacuate dayon"],
      ilo:["Agtalinaed iti kasta unay a natibker a siled, adayo iti tawa","Saan a rummuar bayat ti mata ti bagyo","Saan a bumallasiw iti layus — 6 pulgada laeng ti mangiparmek kenka","I-monitor ti PAGASA babaen ti radyo","Storm surge warning? Agevacuate a dagus"],
      hil:["Magpabilin sa pinakamabakod nga kuarto, malayo sa bintana","Indi maglabas samtang sa mata sang bagyo","Indi magtabok sa baha — 6 pulgada lang makapatumba sa imo","I-monitor ang PAGASA sa radyo","Storm surge warning? Mag-evacuate dayon"],
      bik:["Magdanay sa pinakamatibay na kuarto, harayo sa bintana","Dai maglakaw durante kan mata kan bagyo","Dai magbalyo sa baha — 6 pulgada sana ang patumba sa saimo","Bantayan an PAGASA sa radyo","Storm surge warning? Mag-evacuate giraray"],
      war:["Pabilin ha gimaupay nga kwarto, hirayo ha bintana","Diri maglakat durante han mata han bagyo","Diri magtabok ha baha — 6 pulgada la makakapatumba ha imo","Bantayi an PAGASA ha radyo","Storm surge warning? Mag-evacuate dayon"],
      pam:["Manatili king pekamatibe a kwartu, magpalaut king awang","Echi lual habang king mata ning bagyo","Echi magtabuk king maslam — anam 6 pulgada makapagumba keka","Bantayan ing PAGASA king radyo","Storm surge warning? Mag-evacuate agad"],
      pag:["Manatili ed sankaayadan a kuarto, arawi ed bintana","Ag onla legan na mata na bagyo","Ag ontabok ed danum — 6 pulgada labat so makapatumba ed sika","Bantayan so PAGASA ed radyo","Storm surge warning? Mag-evacuate tampol"],
      mag:["Sa walai a mathito a kalanganan, mawatan ko bintana","Dakembaba ko kawakto o mata o bagyo","Di phanabor ko ig — 6 pulgada bun makaperreg ruka","Pagilaya so PAGASA ko radyo","Storm surge warning? Pangampang ko mapulu"],
      tsg:["Pabilin ha pinakakuat nga lawang, malayu ha tamba","Ayaw lumakaw ha waktu sin mata sin bagyu","Ayaw lumabang ha baha — 6 pulgada da makarukut kaymu","Pamatihay in PAGASA ha radyo","Storm surge warning? Pag'alas dayon"],
    },
    after:{
      en:["Wait for all-clear before going outside","Watch for live wires in floodwater","Report injuries to the barangay health center","Get relief goods at DSWD distribution points","Document damage for assistance claims"],
      tl:["Hintayin ang all-clear bago lumabas","Mag-ingat sa live wires sa baha","Iulat ang mga nasugatan sa barangay health center","Kumuha ng relief goods sa DSWD","I-document ang pinsala para sa assistance"],
      ceb:["Hulata ang all-clear sa dili pa mogawas","Pag-amping sa live wires sa baha","I-report ang nasamdan sa barangay health center","Kuhaa ang relief goods sa DSWD","I-document ang kadaot para sa assistance"],
      ilo:["Aguray ti all-clear sakbay a rummuar","Agannad kadagiti live wires iti layus","Ipadamag dagiti nasugatan iti barangay health center","Alaen dagiti relief goods iti DSWD","I-document ti dadael para iti assistance"],
      hil:["Hulata ang all-clear antes maglabas","Mag-andam sa live wires sa baha","I-report ang nalugadan sa barangay health center","Kuhaa ang relief goods sa DSWD","I-document ang kadto para sa assistance"],
      bik:["Hulaton an all-clear bago maglakaw","Mag-ingat sa live wires sa baha","I-report an nadanyaran sa barangay health center","Kumua nin relief goods sa DSWD","I-document an kadaot para sa assistance"],
      war:["Hulaton an all-clear antes maglakat","Pag-andam ha live wires ha baha","I-report an nasamaran ha barangay health center","Kumuha hin relief goods ha DSWD","I-document an kadto para han assistance"],
      pam:["Asnan ya ing all-clear bayu lual","Mag-ingat kareng live wires king maslam","I-report la reng nasugatan king barangay health center","Kuanan la reng relief goods king DSWD","I-document ya ing danyos para king assistance"],
      pag:["Alagaren so all-clear antis onla","Manalwar ed live wires ed danum","I-report iray nasugatan ed barangay health center","Alaen iray relief goods ed DSWD","I-document so daet para ed assistance"],
      mag:["Nayaw ko all-clear ko di pa lima","Pagingat ko manga gunting sa ig","I-report so manga miyasakitan ko barangay health center","Kowa so relief goods ko DSWD","I-document so kabinasa para ko assistance"],
      tsg:["Hulata in all-clear bang ubus lumakaw","Pag-ingat ha live wires ha baha","I-report in nasaktan pa barangay health center","Kuha in relief goods ha DSWD","I-document in naratay para ha assistance"],
    }},

  { id:"lindol", icon:"🌍", name:{en:"Earthquake",tl:"Lindol",ceb:"Linog",ilo:"Ginggined",hil:"Linog",bik:"Linog",war:"Linog",pam:"Yanyan",pag:"Yanggayang",mag:"Lugu",tsg:"Lupig"},
    levels:{
      en:[{label:"I–II",desc:"Barely felt. No action needed."},{label:"III–IV",desc:"Felt by most. Objects may rattle."},{label:"V–VI",desc:"Significant shaking. Watch for falling objects."},{label:"VII–VIII",desc:"Major damage. Evacuate buildings."},{label:"IX–X",desc:"Extreme destruction. Possible tsunami — move from coast."}],
      tl:[{label:"I–II",desc:"Halos hindi nararamdaman. Walang aksyon."},{label:"III–IV",desc:"Nararamdaman ng karamihan. Maaaring tumalon ang mga bagay."},{label:"V–VI",desc:"Makabuluhang pag-alog. Mag-ingat sa pagbagsak."},{label:"VII–VIII",desc:"Malaking pinsala. Mag-evacuate mula sa mga gusali."},{label:"IX–X",desc:"Matinding pagkasira. Posibleng tsunami — lumayo sa dalampasigan."}],
      ceb:[{label:"I–II",desc:"Halos dili mabati. Walay buhaton."},{label:"III–IV",desc:"Mabati sa kadaghanan. Mahimong mouyog ang mga butang."},{label:"V–VI",desc:"Hilabihang pag-uyog. Pag-amping sa nahulog."},{label:"VII–VIII",desc:"Dakong kadaot. Mag-evacuate sa mga building."},{label:"IX–X",desc:"Grabe nga kadaot. Posibling tsunami — layo sa baybayon."}],
      ilo:[{label:"I–II",desc:"Narikna laeng iti bassit. Awan ti aramidem."},{label:"III–IV",desc:"Narikna ti kaaduan. Mabalin nga aggaraw dagiti banag."},{label:"V–VI",desc:"Nabara a gingined. Agannad iti matnag."},{label:"VII–VIII",desc:"Dakkel a dadael. Agevacuate iti pasdek."},{label:"IX–X",desc:"Nakaru a dadael. Mabalin ti tsunami — adayo iti igid ti baybay."}],
      hil:[{label:"I–II",desc:"Halos indi mabatyagan. Wala buhaton."},{label:"III–IV",desc:"Mabatyagan sang kalabanan. Mahimo magkutkut ang mga butang."},{label:"V–VI",desc:"Daku nga pagtay-og. Mag-andam sa nahulog."},{label:"VII–VIII",desc:"Daku nga kadto. Mag-evacuate sa mga building."},{label:"IX–X",desc:"Grabe nga kadto. Posible tsunami — magpalayo sa baybayon."}],
      bik:[{label:"I–II",desc:"Haros dai namamatean. Mayong gigibohon."},{label:"III–IV",desc:"Namamatean kan kadaklan. Tibaad maglinog an mga gamit."},{label:"V–VI",desc:"Makuring linog. Mag-ingat sa nahulog."},{label:"VII–VIII",desc:"Dakulang kadaot. Mag-evacuate sa mga gusali."},{label:"IX–X",desc:"Grabe na kadaot. Posibleng tsunami — harayo sa baybayon."}],
      war:[{label:"I–II",desc:"Haros diri nababatyag. Waray buhaton."},{label:"III–IV",desc:"Nababatyag han kadam-an. Mahimo maglinog an mga gamit."},{label:"V–VI",desc:"Daku nga linog. Pag-andam ha nahulog."},{label:"VII–VIII",desc:"Dako nga kadto. Mag-evacuate ha mga gusali."},{label:"IX–X",desc:"Grabe nga kadto. Posible tsunami — hirayo ha baybayon."}],
      pam:[{label:"I–II",desc:"Pangapus ya yanyan. Alang gawan."},{label:"III–IV",desc:"Maramdaman da ring marakal. Malyari mag-iwa ring gamit."},{label:"V–VI",desc:"Maragul a yanyan. Mag-ingat king mengalugud."},{label:"VII–VIII",desc:"Maragul a danyos. Mag-evacuate la king gusali."},{label:"IX–X",desc:"Makapagulisak a danyos. Malyari tsunami — magpalaut king pampang."}],
      pag:[{label:"I–II",desc:"Pakaskasin ya labat. Anggapo so gawaen."},{label:"III–IV",desc:"Napikdar na karaklan. Nayarin onggalaw iray gamit."},{label:"V–VI",desc:"Mabiskeg ya yanggayang. Manalwar ed ondelapag."},{label:"VII–VIII",desc:"Baleg ya pansumal. Mag-evacuate ed gusali."},{label:"IX–X",desc:"Makapuyan ya pansumal. Nayarin tsunami — arawi ed gilig dayat."}],
      mag:[{label:"I–II",desc:"Mailay bun. Da'a kapulasan."},{label:"III–IV",desc:"Mailay i kadakelan. Mbaling kalindeg so manga gamit."},{label:"V–VI",desc:"Mala a lugu. Pagingat ko makarregreg."},{label:"VII–VIII",desc:"Mala a kabinasa. Pangampang sa manga gusali."},{label:"IX–X",desc:"Mala a kabinasa. Mbaling tsunami — mawatan ko ig"}],
      tsg:[{label:"I–II",desc:"Hangkadiit da raysa. Way unu pagbuhaten."},{label:"III–IV",desc:"Raysa sin kabanyagan. Mahimu maglupig in manga unu-unu."},{label:"V–VI",desc:"Hambuuk delikado nga lupig. Pag-ingat ha gumuwa'."},{label:"VII–VIII",desc:"Dakula nga kasaktan. Pag'alas pa manga bilding."},{label:"IX–X",desc:"Sangat dakula nga kasaktan. Mahimu tsunami — magpalayu pa baybay."}],
    },
    before:{
      en:["Know fault lines near your area (PHIVOLCS)","Secure heavy furniture to walls","Learn Drop, Cover, Hold On","Identify safe spots in every room","Keep emergency kit within easy reach"],
      tl:["Alamin ang fault lines malapit sa inyong lugar","I-secure ang mga mabibigat na kasangkapan sa dingding","Alamin ang Drop, Cover, Hold On","Tandaan ang ligtas na lugar sa bawat silid","Mag-imbak ng emergency kit sa madaling maabot"],
      ceb:["Hibaloi ang fault lines duol sa inyong lugar","I-secure ang bug-at nga kasangkapan sa dingding","Tun-i ang Drop, Cover, Hold On","Hibaloi ang luwas nga dapit sa tagsa ka kuwarto","Tipigi ang emergency kit sa duol maabot"],
      ilo:["Ammuen dagiti fault lines nga asideg iti lugar yo","I-secure dagiti nadagsen a kasangkapan iti diding","Sukimaten ti Drop, Cover, Hold On","Ammuen dagiti natalged a lugar iti tunggal siled","Idulin ti emergency kit iti nalaka a magun-od"],
      hil:["Tun-i ang fault lines malapit sa inyo lugar","I-secure ang mabug-at nga kasangkapan sa dingding","Tun-i ang Drop, Cover, Hold On","Tandai ang talalupangdan nga lugar sa kada kuarto","Tipigi ang emergency kit sa madali maabot"],
      bik:["Maaraman an fault lines harani sa saindong lugar","I-secure an magabat na gamit sa pader","Manudan an Drop, Cover, Hold On","Mangaraman nin ligtas na lugar sa kada kuarto","Itago an emergency kit sa madali makua"],
      war:["Hibaroa an fault lines hirani han iyo lugar","I-secure an mabug-at nga gamit ha pader","Sukola an Drop, Cover, Hold On","Hibaroa an salipdan nga lugar ha tagsa nga kwarto","Tipigi an emergency kit ha masayon makaabot"],
      pam:["Akilala deng fault lines a malapit king lugal yu","I-secure deng mabayat a kasangkapan king dingding","Sikanan ing Drop, Cover, Hold On","Akilala deng maligtas a lugal king balang kwartu","Idimla ing emergency kit king mabilis maabot"],
      pag:["Amtaen iray fault lines ya asingger ed lugar yo","I-secure iray ambelat ya kasangkapan ed dakdak","Amtaen so Drop, Cover, Hold On","Amtaen iray mareen ya lugar ed kada kuarto","Iyimbak so emergency kit ed mainomay alaen"],
      mag:["Kataw-i so manga fault lines a marani ko darpa nu","Pakatademi so maweg a gamit ko padir","Paganadi so Drop, Cover, Hold On","Tuwi so manga mapiya a darpa ko oman kalanganan","Tagoi so emergency kit ko mainon makowa"],
      tsg:["Kaingatan in manga fault lines malapit ha lugal niyu","Hikapsa in mabug'at nga gamit ha pader","Pag-adji sin Drop, Cover, Hold On","Kaingatan in halal nga lugal ha kada lawang","Pagtipigi in emergency kit ha masayun maabut"],
    },
    during:{
      en:["DROP, COVER your head and neck, HOLD ON","Don't run outside — falling debris is the real danger","Stay away from windows and heavy furniture","Outdoors: move away from buildings and poles","Driving: pull over away from bridges"],
      tl:["DROP, COVER ang ulo at leeg, HOLD ON","Huwag tumakbo palabas — ang debris ang tunay na panganib","Malayo sa mga bintana at mabibigat na kasangkapan","Sa labas: lumayo sa mga gusali at poste","Nagmamaneho: huminto malayo sa tulay"],
      ceb:["DROP, COVER ang ulo ug liog, HOLD ON","Ayaw dalagan pagawas — ang nahulog nga butang ang peligro","Layo sa bintana ug bug-at nga kasangkapan","Sa gawas: layo sa mga building ug poste","Nagmaneho: huminto layo sa tulay"],
      ilo:["DROP, COVER ti ulo ken tengnged, HOLD ON","Saan a tumaray a rummuar — dagiti agtinnag a banag ti pudno a peggad","Adayo iti tawa ken nadagsen a kasangkapan","Iti ruar: umadayo iti pasdek ken poste","Agmanmaneho: agsardeng nga adayo iti rangtay"],
      hil:["DROP, COVER ang ulo kag liog, HOLD ON","Indi magdalagan pagluwas — ang nahulog nga butang ang peligro","Malayo sa bintana kag mabug-at nga kasangkapan","Sa guwa: magpalayo sa mga building kag poste","Nagamaneho: maghapon malayo sa tulay"],
      bik:["DROP, COVER an payo asin lig-on, HOLD ON","Dai magdalagan pasiring sa luwas — an nahulog na gamit an peligro","Harayo sa bintana asin magabat na gamit","Sa luwas: harayo sa mga gusali asin poste","Nagmaneho: magpundo harayo sa tulay"],
      war:["DROP, COVER an ulo ngan liog, HOLD ON","Diri magdalagan pakadto ha gawas — an nahulog nga gamit an peligro","Hirayo ha bintana ngan mabug-at nga gamit","Ha gawas: hirayo ha mga gusali ngan poste","Nagmaneho: humunong hirayo ha tulay"],
      pam:["DROP, COVER ya ing buntuk at lakidlakid, HOLD ON","Echi mag-takbo lual — ing migulpe a gamit ya talagang panganib","Magpalaut king awang at mabayat a kasangkapan","King lual: magpalaut king gusali at poste","Magmaneho: tumigil a magpalaut king tulay"],
      pag:["DROP, COVER so ulo tan beneg, HOLD ON","Ag onbatik ed paway — say napelag a gamit so talagan delikado","Arawi ed bintana tan ambelat a kasangkapan","Ed paway: arawi ed gusali tan poste","Manmaneho: ondunong ya arawi ed tulay"],
      mag:["DROP, COVER so ulo ago lig, HOLD ON","Di phangidalakaw ko liyawaw — so makarregreg a phangenggay panganib","Mawatan ko bintana ago maweg a gamit","Ko liyawaw: mawatan ko gusali ago poste","Pangedraybi: tindeg a mawatan ko taytay"],
      tsg:["DROP, COVER in ulu iban liug, HOLD ON","Ayaw dumagan pa gawas — in unu-unu nagumuwa' in seguru panganib","Magpalayu ha tamba iban mabug'at nga gamit","Ha gawas: magpalayu ha manga bilding iban poste","Pagdraybi: pagtindug malayu ha tulay"],
    },
    after:{
      en:["Expect aftershocks","Check home for cracks before re-entering","No lighters or matches — possible gas leak","Near coast: move to high ground immediately","Reconnect at your family's pre-arranged meeting point"],
      tl:["Asahan ang mga aftershock","Suriin ang bahay para sa mga bitak bago pumasok","Huwag gumamit ng lighter o posporo","Malapit sa dagat: pumunta agad sa mataas na lugar","Makipag-ugnayan sa pamilya sa naka-usapang meeting point"],
      ceb:["Pagdahum og mga aftershock","Susiha ang balay alang sa liki sa dili pa mosulod","Ayaw paggamit og lighter o posporo","Duol sa dagat: dayon padulong sa habog nga lugar","Magkita sa pamilya sa naa-uyonan nga meeting point"],
      ilo:["Mangnamnama kadagiti aftershock","Sukimaten ti balay para iti pagbettak sakbay a sumrek","Saan a mangusar iti lighter wenno posporo","Asideg iti baybay: dagus a mapan iti nangato a lugar","Makitungtong iti pamilya iti naituding a meeting point"],
      hil:["Mag-andam sa mga aftershock","Tan-awa ang balay para sa pagkagisi antes magsulod","Indi maggamit sang lighter ukon posporo","Malapit sa dagat: dayon kadto sa mataas nga lugar","Makigsapaw sa pamilya sa nagkasugtanan nga meeting point"],
      bik:["Maglaom nin aftershock","Hilngon an harong para sa pagkahiwas bago magsulod","Dai maggamit nin lighter o posporo","Harani sa dagat: dayon pasiring sa mataas na lugar","Mag-ugnay sa pamilya sa nagkasundo na meeting point"],
      war:["Pag-abat hin aftershock","Susiha an balay para han pagkagisi antes sumulod","Diri maggamit hin lighter o posporo","Hirani ha dagat: dayon kadto ha mataas nga lugar","Pag-ugnay ha pamilya ha nagkasabutan nga meeting point"],
      pam:["Asni ring aftershock","Lawan ing bale para king mengakwak bayu lub","Echi gumamit lighter o posporo","Malapit king dagat: agad king mas mataas a lugal","Makisabi king pamilya king mipagkasundo a meeting point"],
      pag:["Manalwar ed aftershock","Imanoen so abung no walay ag onloob","Ag mangusar na lighter o posporo","Asingger ed dayat: tampol ed atagey ya lugar","Mitongtong ed pamilya ed apanmoria a meeting point"],
      mag:["Pangilaya so aftershock","Ilaya so walai sa kapulnga ko di pa songod","Di pakagunontolan na lighter atawa posporo","Marani ko ig: ungkai sa malayang darpa","Pagayonayon ko pamilya ko miyaisipan a meeting point"],
      tsg:["Pag-ingat ha aftershock","Bilahanga in bay bang dayn in piso bang ubus sumulud","Ayaw paggamit lighter atawa posporo","Malapit ha baybay: dayon pa malayu nga lugal","Pagsabunga in pamilya ha hisaun nga meeting point"],
    }},

  { id:"bulkan", icon:"🌋", name:{en:"Volcano",tl:"Bulkan",ceb:"Bulkan",ilo:"Bolkan",hil:"Bulkan",bik:"Bulkan",war:"Bulkan",pam:"Bulkan",pag:"Bulkan",mag:"Bulkan",tsg:"Bulkan"},
    levels:{
      en:[{label:"Alert 1",desc:"Low activity. Monitor PHIVOLCS bulletins."},{label:"Alert 2",desc:"Growing unrest. Eruption possible."},{label:"Alert 3",desc:"Eruption imminent. Evacuate danger zone."},{label:"Alert 4",desc:"Hazardous eruption within hours or days."},{label:"Alert 5",desc:"Intense eruption ongoing. Follow NDRRMC orders."}],
      tl:[{label:"Alert 1",desc:"Mababang aktibidad. Bantayan ang PHIVOLCS."},{label:"Alert 2",desc:"Lumalaking gulo. Maaaring mag-erupt."},{label:"Alert 3",desc:"Malapit nang mag-erupt. Mag-evacuate sa danger zone."},{label:"Alert 4",desc:"Mapanganib na eruption sa loob ng ilang oras o araw."},{label:"Alert 5",desc:"Matinding eruption. Sundin ang lahat ng utos ng NDRRMC."}],
      ceb:[{label:"Alert 1",desc:"Ubos nga aktibidad. Bantayi ang PHIVOLCS."},{label:"Alert 2",desc:"Nagdako nga kaguliyang. Posible mubuto."},{label:"Alert 3",desc:"Hapit na mubuto. Mag-evacuate sa danger zone."},{label:"Alert 4",desc:"Peligroso nga eruption sulod sa pipila ka oras o adlaw."},{label:"Alert 5",desc:"Grabe nga eruption. Sunda ang tanang sugo sa NDRRMC."}],
      ilo:[{label:"Alert 1",desc:"Nababa nga aktibidad. Bantayan ti PHIVOLCS."},{label:"Alert 2",desc:"Dumakdakkel ti riribuk. Mabalin nga agbuteng."},{label:"Alert 3",desc:"Asidegen ti panagbuteng. Agevacuate iti danger zone."},{label:"Alert 4",desc:"Napeggad nga eruption iti sumagmamano nga oras wenno aldaw."},{label:"Alert 5",desc:"Nabara nga eruption. Surotem dagiti bilin ti NDRRMC."}],
      hil:[{label:"Alert 1",desc:"Manubo nga aktibidad. Bantayi ang PHIVOLCS."},{label:"Alert 2",desc:"Nagadaku nga gamo. Posible magbuto."},{label:"Alert 3",desc:"Madali na magbuto. Mag-evacuate sa danger zone."},{label:"Alert 4",desc:"Peligroso nga eruption sa sulod sang pila ka oras ukon adlaw."},{label:"Alert 5",desc:"Grabe nga eruption. Sunda ang tanan nga sugo sang NDRRMC."}],
      bik:[{label:"Alert 1",desc:"Hababa na aktibidad. Bantayan an PHIVOLCS."},{label:"Alert 2",desc:"Naghihiwas na gibo. Posibleng mag-erupt."},{label:"Alert 3",desc:"Madali na mag-erupt. Mag-evacuate sa danger zone."},{label:"Alert 4",desc:"Peligroso na eruption sa laog nin pira ka oras o aldaw."},{label:"Alert 5",desc:"Grabe na eruption. Sunudon an gabos na orden kan NDRRMC."}],
      war:[{label:"Alert 1",desc:"Hubad nga aktibidad. Bantayi an PHIVOLCS."},{label:"Alert 2",desc:"Nagtitubo nga kaguliyang. Posible mag-erupt."},{label:"Alert 3",desc:"Hirani na mag-erupt. Mag-evacuate ha danger zone."},{label:"Alert 4",desc:"Peligroso nga eruption ha sulod hin pira ka oras o adlaw."},{label:"Alert 5",desc:"Grabe nga eruption. Sunda an ngatanan nga sugo han NDRRMC."}],
      pam:[{label:"Alert 1",desc:"Mababang aktibidad. Bantayan ing PHIVOLCS."},{label:"Alert 2",desc:"Mengalaglagan a gulo. Malyari mag-erupt."},{label:"Alert 3",desc:"Magcha mag-erupt. Mag-evacuate king danger zone."},{label:"Alert 4",desc:"Maraksang eruption king ilalim da reng pilan oras o aldo."},{label:"Alert 5",desc:"Maragul a eruption. Sundan deng utus na NDRRMC."}],
      pag:[{label:"Alert 1",desc:"Abeba ya aktibidad. Bantayan so PHIVOLCS."},{label:"Alert 2",desc:"Onlolooy a gulo. Nayarin onbuteg."},{label:"Alert 3",desc:"Asingger lan onbuteg. Mag-evacuate ed danger zone."},{label:"Alert 4",desc:"Mapeligro ya eruption ed loob na pigaran oras o agew."},{label:"Alert 5",desc:"Mabiskeg ya eruption. Tumboken iray ganggan na NDRRMC."}],
      mag:[{label:"Alert 1",desc:"Mababa a aktibidad. Pagilaya so PHIVOLCS."},{label:"Alert 2",desc:"Pphakaragon a kambabagonbagon. Mbaling phangenggay."},{label:"Alert 3",desc:"Magcha phangenggay. Pangampang ko danger zone."},{label:"Alert 4",desc:"Mawatan a eruption ko pira oras atawa gawii."},{label:"Alert 5",desc:"Mala a eruption. Onotan so manga sogo o NDRRMC."}],
      tsg:[{label:"Alert 1",desc:"Hangkadiit nga aktibidad. Pamatihay in PHIVOLCS."},{label:"Alert 2",desc:"Dumakulaan in guba'. Mahimu gumuwa'."},{label:"Alert 3",desc:"Hangkamayan na gumuwa'. Pag'alas ha danger zone."},{label:"Alert 4",desc:"Delikado nga eruption ha sulud hambuuk oras atawa adlaw."},{label:"Alert 5",desc:"Dakula nga eruption. Tumana in manga sara' sin NDRRMC."}],
    },
    before:{
      en:["Know if you are in the Permanent Danger Zone","Stock N95 masks for ashfall","Prepare goggles for eye protection","Know evacuation routes away from the volcano","Protect crops and animals from ash"],
      tl:["Alamin kung nasa Permanent Danger Zone ka","Mag-imbak ng N95 masks para sa ashfall","Ihanda ang goggles para sa mata","Alamin ang evacuation routes palayo sa bulkan","Protektahan ang mga tanim at hayop mula sa abo"],
      ceb:["Hibaloi kung naa sa Permanent Danger Zone ka","Tipigi ang N95 masks alang sa abo","Andama ang goggles para sa mata","Hibaloi ang evacuation routes palayo sa bulkan","Protektahi ang mga tanom ug hayop gikan sa abo"],
      ilo:["Ammuen no addaka iti Permanent Danger Zone","Idulin ti N95 masks para iti dapo","Isagana ti goggles para iti mata","Ammuen dagiti evacuation routes nga adayo iti bolkan","Saluadan dagiti mula ken ayup manipud iti dapo"],
      hil:["Tun-i kon sa Permanent Danger Zone ka","Tipigi ang N95 masks para sa abo","Handaa ang goggles para sa mata","Tun-i ang evacuation routes palayo sa bulkan","Protektahi ang mga tanom kag sapat halin sa abo"],
      bik:["Maaraman kun ika sa Permanent Danger Zone","Itago an N95 masks para sa abo","Andamon an goggles para sa mata","Maaraman an evacuation routes harayo sa bulkan","Protektaran an mga tanom asin hayop sa abo"],
      war:["Hibaroa kun ikaw ha Permanent Danger Zone","Tipigi an N95 masks para han abo","Andama an goggles para han mata","Hibaroa an evacuation routes hirayo ha bulkan","Protektari an mga tanom ngan hayop tikang ha abo"],
      pam:["Akilala nu nakapaloob ka king Permanent Danger Zone","Idimla ring N95 masks para king abo","Isadya ing goggles para king mata","Akilala deng evacuation routes magpalaut king bulkan","Ilaga reng tanaman at animal king abo"],
      pag:["Amtaen no wala' ka ed Permanent Danger Zone","Iyimbak iray N95 masks parad abo","Iparaan so goggles parad mata","Amtaen iray evacuation routes ya arawi ed bulkan","Salimbengen iray tanaman tan ayep ed abo"],
      mag:["Kataw-i amay ka ko Permanent Danger Zone","Tagoi so N95 masks ko abo","Pakasdiyai so goggles ko mata","Kataw-i so manga evacuation routes a mawatan ko bulkan","Pagipataro so manga pananom ago ayam ko abo"],
      tsg:["Kaingatan bang ikaw ha Permanent Danger Zone","Pagtipigi N95 masks para ha abu","Hikapsa goggles para ha mata","Kaingatan in manga evacuation routes magpalayu ha bulkan","Bantayi in manga tanom iban sattu' dayn ha abu"],
    },
    during:{
      en:["Evacuate immediately — do not wait","Wear N95 mask and cover your body","Close all windows, doors, and vents","Avoid driving in ashfall — visibility is dangerous","Stay in evacuation center until cleared"],
      tl:["Mag-evacuate agad — huwag mag-antay","Magsuot ng N95 mask at takpan ang katawan","Isara ang lahat ng bintana, pinto, at ventilation","Iwasang magmaneho sa ashfall","Manatili sa evacuation center hanggang ligtas"],
      ceb:["Mag-evacuate dayon — ayaw paghulat","Pagsul-ob og N95 mask ug tabuni ang lawas","Sirad-i ang tanang bintana, pultahan, ug ventilation","Likayi ang pagmaneho sa abo","Pabilin sa evacuation center hangtod luwas"],
      ilo:["Agevacuate a dagus — saan nga aguray","Agusar iti N95 mask ket abbongan ti bagi","Ikkaten dagiti amin a tawa, ridaw, ken ventilation","Liklikan ti panagmaneho iti dapo","Agtalinaed iti evacuation center agingga a natalged"],
      hil:["Mag-evacuate dayon — indi maghulat","Magsuksok sang N95 mask kag taklupi ang lawas","Sirado ang tanan nga bintana, puertahan, kag ventilation","Likawi ang pagmaneho sa abo","Magpabilin sa evacuation center hasta luwas"],
      bik:["Mag-evacuate giraray — dai maghalat","Magsulot nin N95 mask asin takupan an hawak","Sarahan an gabos na bintana, pinto, asin ventilation","Likayan an pagmaneho sa abo","Magdanay sa evacuation center sagkod ligtas na"],
      war:["Mag-evacuate dayon — diri maghulat","Magsul-ot hin N95 mask ngan tabuni an lawas","Sira-i an ngatanan nga bintana, purtahan, ngan ventilation","Likyahi an pagmaneho ha abo","Pabilin ha evacuation center tubtob salipdan"],
      pam:["Mag-evacuate agad — echi mag-asni","Magsulud N95 mask at takpan ing katawan","Isara reng sablang awang, pasbul, at ventilation","Ilagan ing magmaneho king abo","Manatili king evacuation center anggang maligtas"],
      pag:["Mag-evacuate la tampol — ag manalagar","Mangisulong na N95 mask tan sakbongan so laman","Iyarum iray amin a bintana, puerta, tan ventilation","Paliisan so onmaneho ed abo","Manatili ed evacuation center anggad mareen"],
      mag:["Pangampang ko mapulu — di phangayaw","Pasoddi N95 mask ago tabingi so lawan","Tarosi so langun a bintana, baba, ago ventilation","Awati so pangedraybi ko abo","Sa walai matatap ko evacuation center taman ko kalilintad"],
      tsg:["Pag'alas dayon — ayaw maghulat","Magsul'ut N95 mask iban tabuni in baran","Tambuki in katibuk-an nga tamba, bawang, iban ventilation","Liyusi in pagdraybi ha abu","Pabilin ha evacuation center asal halal na"],
    },
    after:{
      en:["Clear ash from roof — it is heavy and can collapse it","Keep children away from ash","Check drinking water for ash contamination","Wait for PHIVOLCS all-clear before returning","Report respiratory cases to health center"],
      tl:["Linisin ang abo sa bubong — mabigat at mapanganib","Panatilihing malayo ang mga bata sa abo","Suriin ang inuming tubig","Hintayin ang all-clear mula sa PHIVOLCS","Iulat ang mga respiratory cases sa health center"],
      ceb:["Hawani ang abo sa atop — bug-at ug mapeligroso","Ipahilayo ang mga bata sa abo","Susiha ang ilimnon nga tubig","Hulata ang all-clear gikan sa PHIVOLCS","I-report ang respiratory cases sa health center"],
      ilo:["Dalusan ti dapo iti atep — nadagsen ken napeggad","Iyadayo dagiti ubbing iti dapo","Sukimaten ti mainum a danum","Aguray ti all-clear manipud iti PHIVOLCS","Ipadamag dagiti respiratory cases iti health center"],
      hil:["Tinluan ang abo sa atop — mabug-at kag peligroso","Ipalayo ang mga bata sa abo","Tan-awa ang ilimnon nga tubig","Hulata ang all-clear halin sa PHIVOLCS","I-report ang respiratory cases sa health center"],
      bik:["Linigan an abo sa atop — magabat asin peligroso","Ilikay an mga aki sa abo","Susihon an iinomon na tubig","Hulaton an all-clear gikan sa PHIVOLCS","I-report an respiratory cases sa health center"],
      war:["Hawani an abo ha atop — mabug-at ngan peligroso","Ipahirayo an mga bata ha abo","Susiha an iinom nga tubig","Hulaton an all-clear tikang ha PHIVOLCS","I-report an respiratory cases ha health center"],
      pam:["Linisan ing abo king bubung — mabayat at maraksa","Ipalaut la reng anak king abo","Lawan ing minuman a danum","Asnan ya ing all-clear ibat king PHIVOLCS","I-report la reng respiratory cases king health center"],
      pag:["Linisan so abo ed atep — ambelat tan mapeligro","Iyarawi iray ugaw ed abo","Imanoen so ya-inum ya danum","Alagaren so all-clear ya manlapu ed PHIVOLCS","I-report iray respiratory cases ed health center"],
      mag:["Phangilakad so abo ko atep — mawatan ago malingasa","Pagawata so manga wata ko abo","Ilaya so iinomn a ig","Nayaw so all-clear a phoon ko PHIVOLCS","I-report so manga respiratory cases ko health center"],
      tsg:["Lugayhi in abu ha atup — mabug'at iban delikado","Liyusi in manga anak dayn ha abu","Bilahanga in iinum nga tubig","Hulata in all-clear dayn ha PHIVOLCS","I-report in respiratory cases pa health center"],
    }},

  { id:"baha", icon:"💧", name:{en:"Flood",tl:"Baha",ceb:"Lunop",ilo:"Layus",hil:"Baha",bik:"Baha",war:"Baha",pam:"Lalam",pag:"Delap",mag:"Ig",tsg:"Baha"},
    levels:{
      en:[{label:"Advisory",desc:"Flooding possible in low areas."},{label:"Watch",desc:"Flooding likely within 6–12 hours. Prepare."},{label:"Warning",desc:"Flooding occurring or imminent. Evacuate now."},{label:"Flash Flood",desc:"Sudden mountain flood. Move away from rivers."}],
      tl:[{label:"Advisory",desc:"Posibleng mag-baha sa mababang lugar."},{label:"Watch",desc:"Maaaring mag-baha sa loob ng 6–12 oras. Maghanda."},{label:"Warning",desc:"Baha na o mabilis na darating. Mag-evacuate agad."},{label:"Flash Flood",desc:"Biglaang baha mula sa bundok. Lumayo agad sa mga ilog."}],
      ceb:[{label:"Advisory",desc:"Posibling mulunop sa ubos nga lugar."},{label:"Watch",desc:"Posibling mulunop sulod sa 6–12 ka oras. Pangandam."},{label:"Warning",desc:"Naa nay lunop o hapit na. Mag-evacuate dayon."},{label:"Flash Flood",desc:"Kalit nga lunop gikan sa bukid. Layo dayon sa mga suba."}],
      ilo:[{label:"Advisory",desc:"Mabalin nga aglayus iti nababa a lugar."},{label:"Watch",desc:"Mabalin nga aglayus iti unos ti 6–12 nga oras. Agsagana."},{label:"Warning",desc:"Adda layus wenno umadanin. Agevacuate a dagus."},{label:"Flash Flood",desc:"Kellaat a layus manipud iti bantay. Umadayo a dagus iti karayan."}],
      hil:[{label:"Advisory",desc:"Posible magbaha sa manubo nga lugar."},{label:"Watch",desc:"Posible magbaha sa sulod sang 6–12 ka oras. Mag-andam."},{label:"Warning",desc:"Nagabaha na ukon madali na. Mag-evacuate dayon."},{label:"Flash Flood",desc:"Hinali nga baha halin sa bukid. Magpalayo dayon sa mga suba."}],
      bik:[{label:"Advisory",desc:"Posibleng magbaha sa hababang lugar."},{label:"Watch",desc:"Posibleng magbaha sa laog nin 6–12 oras. Mag-andam."},{label:"Warning",desc:"Nagbabaha na o madali na. Mag-evacuate giraray."},{label:"Flash Flood",desc:"Biglang baha gikan sa bukid. Harayo giraray sa mga salog."}],
      war:[{label:"Advisory",desc:"Posible mag-baha ha hubad nga lugar."},{label:"Watch",desc:"Posible mag-baha ha sulod hin 6–12 ka oras. Pag-andam."},{label:"Warning",desc:"Nagbabaha na o hirani na. Mag-evacuate dayon."},{label:"Flash Flood",desc:"Kalit nga baha tikang ha bukid. Hirayo dayon ha mga salog."}],
      pam:[{label:"Advisory",desc:"Malyari malam king mababang lugal."},{label:"Watch",desc:"Malyari malam king ilalim na 6–12 oras. Magsadya."},{label:"Warning",desc:"Malam o magcha. Mag-evacuate agad."},{label:"Flash Flood",desc:"Bigla a lalam ibat king bunduk. Magpalaut agad king ilug."}],
      pag:[{label:"Advisory",desc:"Nayarin ondelap ed abeban lugar."},{label:"Watch",desc:"Nayarin ondelap ed loob na 6–12 oras. Mangiparaan."},{label:"Warning",desc:"Walay delap o asingger lan. Mag-evacuate la tampol."},{label:"Flash Flood",desc:"Tampol ya delap a manlapu ed palandey. Arawi la tampol ed ilog."}],
      mag:[{label:"Advisory",desc:"Mbaling kalamoda ko mababa a darpa."},{label:"Watch",desc:"Mbaling kalamoda ko pira oras. Pakasdiya."},{label:"Warning",desc:"Miyamoda atawa magcha. Pangampang ko mapulu."},{label:"Flash Flood",desc:"Mapulu a kalamoda a phoon ko palaw. Mawatan ko mapulu ko manga lawasaig."}],
      tsg:[{label:"Advisory",desc:"Mahimu malaha ha hababa nga lugal."},{label:"Watch",desc:"Mahimu malaha ha 6–12 ka oras. Pagtagamak."},{label:"Warning",desc:"Naglaha na atawa hangkamayan na. Pag'alas dayon."},{label:"Flash Flood",desc:"Diritso nga laha dayn ha bukid. Magpalayu dayon ha manga suba'."}],
    },
    before:{
      en:["Check if your area is flood-prone","Elevate important items and documents","Know your nearest evacuation center","Don't sleep near rivers during heavy rain","Store food and water for 3 days"],
      tl:["Alamin kung flood-prone area ka","Itaas ang mga importanteng gamit at dokumento","Alamin ang pinakamalapit na evacuation center","Huwag matulog sa tabi ng ilog tuwing malakas ang ulan","Mag-imbak ng pagkain at tubig para sa 3 araw"],
      ceb:["Hibaloi kung flood-prone ang inyong lugar","I-taas ang importanteng gamit ug dokumento","Hibaloi ang duol nga evacuation center","Ayaw katulog duol sa suba kung kusog ang ulan","Tipigi ang pagkaon ug tubig para sa 3 ka adlaw"],
      ilo:["Ammuen no flood-prone ti lugar yo","Ingatuan dagiti napateg a banag ken dokumento","Ammuen ti kasingaasidegan nga evacuation center","Saan a maturog iti igid ti karayan no napigsa ti tudo","Idulin ti taraon ken danum para iti 3 nga aldaw"],
      hil:["Tun-i kon flood-prone ang inyo lugar","Bayawa ang importante nga gamit kag dokumento","Tun-i ang pinakamalapit nga evacuation center","Indi magtulog malapit sa suba kon mabaskog ang ulan","Tipigi ang pagkaon kag tubig para sa 3 ka adlaw"],
      bik:["Maaraman kun flood-prone an saimong lugar","Itaas an mga importanteng gamit asin dokumento","Maaraman an pinakaharaning evacuation center","Dai magturog harani sa salog pag makusog an uran","Itago an kakanon asin tubig para sa 3 aldaw"],
      war:["Hibaroa kun flood-prone an iyo lugar","Ipataas an mga importante nga gamit ngan dokumento","Hibaroa an pinakahirani nga evacuation center","Diri magkaturog hirani han salog kun makusog an uran","Tipigi an pagkaon ngan tubig para han 3 ka adlaw"],
      pam:["Akilala nu flood-prone ya ing lugal yu","Itas la reng mahalagang gamit at dokumento","Akilala ing malapit a evacuation center","Echi maturi king malapit ning ilug istung maragul ya uran","Idimla ing pamangan at danum para king 3 aldo"],
      pag:["Amtaen no flood-prone so lugar yo","Itagey iray importantin gamit tan dokumento","Amtaen so asingger ya evacuation center","Ag onugip ed asingger na ilog no mabiskeg so uran","Iyimbak so naakan tan danum parad 3 agew"],
      mag:["Kataw-i amay kalamoda so darpa nu","Pakatasi so manga makagaga gamit ago dokumento","Tuwi so marani a evacuation center","Di phakatorog ko marani ko lawasaig amay mawatan i oran","Tagoi so kanon ago ig ko 3 gawii"],
      tsg:["Kaingatan bang malaha in lugal niyu","Pataasun in manga importante nga gamit iban dokumento","Kaingatan in malapit nga evacuation center","Ayaw pagtuyug malapit ha suba' bang mabug'at in ulan","Pagtipigi in kakaun iban tubig para 3 ka adlaw"],
    },
    during:{
      en:["Never walk or drive through floodwater","Stay away from rivers and drainage channels","Turn off electricity before water rises","Go upstairs if you cannot evacuate","Sealed plastic bottles can be an improvised life vest"],
      tl:["Huwag lumakad o magmaneho sa baha","Lumayo sa mga ilog at drainage","I-off ang kuryente bago tumaas ang tubig","Pumunta sa itaas kung hindi kayang lumabas","Sealed plastic bottles ay maaaring gamitin bilang life vest"],
      ceb:["Ayaw paglakaw o pagmaneho sa baha","Layo sa mga suba ug drainage","I-off ang kuryente sa dili pa motaas ang tubig","Adto sa taas kung dili maka-evacuate","Sealed plastic bottles mahimong life vest"],
      ilo:["Saan a magna wenno magmaneho iti layus","Adayo iti karayan ken drainage","I-off ti kuryente sakbay nga umngato ti danum","Mapan iti ngato no saan a makaevacuate","Mabalin a life vest ti naselyaan a plastic bottles"],
      hil:["Indi maglakat ukon magmaneho sa baha","Magpalayo sa mga suba kag drainage","I-off ang kuryente antes magtaas ang tubig","Magkadto sa ibabaw kon indi makahalin","Sealed plastic bottles mahimo life vest"],
      bik:["Dai maglakaw o magmaneho sa baha","Harayo sa mga salog asin drainage","I-off an kuryente bago magtaas an tubig","Magsakat sa ibabaw kun dai makaevacuate","Sealed plastic bottles puwedeng gamiton na life vest"],
      war:["Diri maglakat o magmaneho ha baha","Hirayo ha mga salog ngan drainage","I-off an kuryente antes magtaas an tubig","Sakat ha igbaw kun diri makaevacuate","Sealed plastic bottles puydi gamiton nga life vest"],
      pam:["Echi magdalan o magmaneho king lalam","Magpalaut king ilug at drainage","I-off ing kuryenti bayu tumas ing danum","Mako king babo nung ali makalual","Sealed plastic bottles malyari gamitan a life vest"],
      pag:["Ag manakar o onmaneho ed delap","Arawi ed ilog tan drainage","I-off so koryente antis ondinayew so danum","Onla ed tagey no ag makaonla","Sealed plastic bottles nayarin usaren bilang life vest"],
      mag:["Di phangedalakaw atawa pangedraybi ko ig","Mawatan ko lawasaig ago drainage","Boli so koryinti ko di pa kapuro so ig","Song ko poro amay di kagaga lima","Sealed plastic bottles mbaling gunaan a life vest"],
      tsg:["Ayaw lumakaw atawa magdraybi pa laha","Magpalayu ha manga suba' iban drainage","Patyun in kuryente bang ubus dumakula in tubig","Sakat pa taas bang di makaalas","Sealed plastic bottles mahimu gamiton nga life vest"],
    },
    after:{
      en:["Don't use tap water until confirmed safe","Watch for leptospirosis — don't wade barefoot","Clean and disinfect your home","Report missing persons to barangay","Get leptospirosis prophylaxis if exposed"],
      tl:["Huwag gumamit ng tubig sa gripo hanggang ligtas","Mag-ingat sa leptospirosis — huwag lumakad nang walang sapatos","Linisin at i-disinfect ang bahay","Iulat ang mga nawawala sa barangay","Humingi ng leptospirosis prophylaxis sa health center"],
      ceb:["Ayaw paggamit og tubig sa gripo hangtod luwas","Pag-amping sa leptospirosis — ayaw paglakaw nga walay sandalyas","Limpyohan ug disinfect ang balay","I-report ang nawala sa barangay","Pangayo og leptospirosis prophylaxis sa health center"],
      ilo:["Saan nga usaren ti danum iti gripo agingga a natalged","Agannad iti leptospirosis — saan nga magna nga awan sandalyas","Dalusan ken disinfect ti balay","Ipadamag dagiti napukaw iti barangay","Dumawat iti leptospirosis prophylaxis iti health center"],
      hil:["Indi gamiton ang tubig sa gripo hasta luwas","Mag-andam sa leptospirosis — indi maglakat nga wala sandalyas","Tinluan kag disinfect ang balay","I-report ang nadula sa barangay","Magpangayo sang leptospirosis prophylaxis sa health center"],
      bik:["Dai gamiton an tubig sa gripo sagkod ligtas na","Mag-ingat sa leptospirosis — dai maglakaw na mayong sandalyas","Linigan asin disinfect an harong","I-report an nawawara sa barangay","Maghagad nin leptospirosis prophylaxis sa health center"],
      war:["Diri gamiton an tubig ha gripo tubtob salipdan","Pag-andam ha leptospirosis — diri maglakat nga waray sandalyas","Hinloi ngan disinfect an balay","I-report an nawawara ha barangay","Pangaro hin leptospirosis prophylaxis ha health center"],
      pam:["Echi gumamit danum king gripo anggang maligtas","Mag-ingat king leptospirosis — echi magdalan ala sandalyas","Linisan at disinfect ing bale","I-report la reng mawala king barangay","Manyaman leptospirosis prophylaxis king health center"],
      pag:["Ag mangusar na danum ed gripo anggad mareen","Manalwar ed leptospirosis — ag manakar ya anggapoy sandalyas","Linisan tan disinfect so abung","I-report iray nababalang ed barangay","Mikerew na leptospirosis prophylaxis ed health center"],
      mag:["Di phangonotan na ig ko gripo taman ko kalilintad","Pagingat ko leptospirosis — di phangedalakaw a wata sandalyas","Pangilakad ago disinfect so walai","I-report so manga nawawala ko barangay","Pangenged sa leptospirosis prophylaxis ko health center"],
      tsg:["Ayaw paggamit tubig ha gripo asal halal","Pag-ingat ha leptospirosis — ayaw lumakaw way sandalyas","Lugayhi iban disinfect in bay","I-report in nawala pa barangay","Mangayu leptospirosis prophylaxis ha health center"],
    }},

  { id:"tsunami", icon:"🌊", name:{en:"Tsunami",tl:"Tsunami",ceb:"Tsunami",ilo:"Tsunami",hil:"Tsunami",bik:"Tsunami",war:"Tsunami",pam:"Tsunami",pag:"Tsunami",mag:"Tsunami",tsg:"Tsunami"},
    levels:{
      en:[{label:"Watch",desc:"Tsunami possible. Stay alert."},{label:"Warning",desc:"Evacuate to high ground immediately."},{label:"Natural Signs",desc:"Strong quake + sea receding = evacuate NOW."}],
      tl:[{label:"Watch",desc:"Posibleng may tsunami. Maging alerto."},{label:"Warning",desc:"Mag-evacuate agad sa mataas na lugar."},{label:"Natural Signs",desc:"Malakas na lindol + pagtaas/pagbaba ng dagat = mag-evacuate AGAD."}],
      ceb:[{label:"Watch",desc:"Posibling tsunami. Pagbantay."},{label:"Warning",desc:"Mag-evacuate dayon sa habog nga lugar."},{label:"Natural Signs",desc:"Kusog nga linog + pagsaka/pagubos sa dagat = mag-evacuate KARON."}],
      ilo:[{label:"Watch",desc:"Mabalin nga adda tsunami. Agalisto."},{label:"Warning",desc:"Agevacuate a dagus iti nangato a lugar."},{label:"Natural Signs",desc:"Napigsa a gingined + panagngato/panagbaba ti baybay = agevacuate ITA."}],
      hil:[{label:"Watch",desc:"Posible may tsunami. Mag-andam."},{label:"Warning",desc:"Mag-evacuate dayon sa mataas nga lugar."},{label:"Natural Signs",desc:"Mabaskog nga linog + pagsaka/pagdulhog sang dagat = mag-evacuate KARON."}],
      bik:[{label:"Watch",desc:"Posibleng magkaigwa nin tsunami. Mag-alerto."},{label:"Warning",desc:"Mag-evacuate giraray sa mataas na lugar."},{label:"Natural Signs",desc:"Makusog na linog + pagsakat/pagbaba kan dagat = mag-evacuate NGUNYAN."}],
      war:[{label:"Watch",desc:"Posible nga tsunami. Pag-alerto."},{label:"Warning",desc:"Mag-evacuate dayon ha mataas nga lugar."},{label:"Natural Signs",desc:"Makusog nga linog + pagsaka/pagubos han dagat = mag-evacuate YANA."}],
      pam:[{label:"Watch",desc:"Malyari tsunami. Mag-ingat."},{label:"Warning",desc:"Mag-evacuate agad king mas mataas a lugal."},{label:"Natural Signs",desc:"Maragul a yanyan + ditas/lusong na dagat = mag-evacuate KEYNI NA."}],
      pag:[{label:"Watch",desc:"Nayarin walay tsunami. Manalwar."},{label:"Warning",desc:"Mag-evacuate la tampol ed atagey ya lugar."},{label:"Natural Signs",desc:"Mabiskeg ya yanggayang + ondalakgey/ondinayew na dayat = mag-evacuate NATAN."}],
      mag:[{label:"Watch",desc:"Mbaling tsunami. Pangilaya."},{label:"Warning",desc:"Pangampang ko mapulu ko malayang darpa."},{label:"Natural Signs",desc:"Mala a lugu + kaped a kambitas/kababa o ig = pangampang IMANTO."}],
      tsg:[{label:"Watch",desc:"Mahimu tsunami. Pag-ingat."},{label:"Warning",desc:"Pag'alas dayon pa malayu nga lugal."},{label:"Natural Signs",desc:"Hambuuk lupig + pagdakula/pagkubus sin dagat = pag'alas BIHAUN."}],
    },
    before:{
      en:["Know if your area is low-lying and coastal","Memorize routes to high ground","Learn natural signs — quake, sea rising or receding","Don't wait for official warning — nature warns first","Practice a family evacuation drill"],
      tl:["Alamin kung mababa ang inyong lugar at malapit sa dagat","Kabisahin ang evacuation route papunta sa mataas na lugar","Alamin ang mga natural na babala","Huwag hintayin ang opisyal na babala","Mag-practise ng family evacuation drill"],
      ceb:["Hibaloi kung ubos ug duol sa dagat ang inyong lugar","Hibaloi ang dalan padulong sa habog","Tun-i ang natural nga mga timailhan","Ayaw paghulat sa opisyal nga pasidaan","Mag-practice og family evacuation drill"],
      ilo:["Ammuen no nababa ken asideg iti baybay ti lugar yo","Apuan ti dalan a mapan iti nangato","Sukimaten dagiti natural a tanda","Saan nga agur-uray iti opisyal a ballaag","Agpraktis iti family evacuation drill"],
      hil:["Tun-i kon manubo kag malapit sa dagat ang inyo lugar","Tun-i ang dalan padulong sa mataas","Tun-i ang natural nga mga senyales","Indi maghulat sa opisyal nga paandam","Mag-practice sang family evacuation drill"],
      bik:["Maaraman kun hababa asin harani sa dagat an saimong lugar","Maaraman an dalan pasiring sa mataas","Maaraman an natural na mga senyales","Dai maghalat sa opisyal na patanid","Mag-practice nin family evacuation drill"],
      war:["Hibaroa kun hubad ngan hirani ha dagat an iyo lugar","Hibaroa an dalan pakadto ha mataas","Hibaroa an natural nga mga senyas","Diri maghulat ha opisyal nga pahamatngon","Mag-practice hin family evacuation drill"],
      pam:["Akilala nu mababa at malapit king dagat ing lugal yu","Sapan ing dalan king mataas","Akilala deng natural a senyales","Echi mag-asni king opisyal a pasibul","Mag-practice na family evacuation drill"],
      pag:["Amtaen no abeba tan asingger ed dayat so lugar yo","Amtaen so dalan ed atagey","Amtaen iray natural ya tanda","Ag manalagar ed opisyal ya pasakbay","Manpraktis na family evacuation drill"],
      mag:["Kataw-i amay mababa ago marani ko ig so darpa nu","Tademi so lalan ko malayang darpa","Kataw-i so manga natural a tanda","Di phangayaw ko opisyal a pamakasabut","Pagprastis sa family evacuation drill"],
      tsg:["Kaingatan bang hababa iban malapit ha dagat in lugal niyu","Kaingatan in dalan pa malayu","Kaingatan in manga natural nga tanda","Ayaw maghulat ha opisyal nga hindu","Pagprastis sin family evacuation drill"],
    },
    during:{
      en:["Strong coastal quake? RUN to high ground now","By the time you see the wave, it is too late","Reach the highest point possible","Don't return after the first wave — more are coming","Stay until officially declared safe"],
      tl:["Malakas na lindol sa tabing-dagat? TUMAKBO agad","Kapag nakita mo na ang alon, huli na","Pumunta sa pinakamataas na lugar na maabot","Huwag bumalik pagkatapos ng unang alon","Manatili hanggang opisyal na ligtas na"],
      ceb:["Kusog nga linog sa baybayon? DAGAN dayon sa habog","Kung nakita na ang balod, ulahi na","Adto sa pinaka-habog nga maabot","Ayaw pagbalik human sa unang balod","Pabilin hangtod opisyal nga luwas"],
      ilo:["Napigsa a gingined iti igid ti baybay? TUMARAY a dagus","Iti panangkitam ti dalluyon, naladawen","Mapan iti kangatuan a lugar a magun-od","Saan a agsubli kalpasan ti immuna a dalluyon","Agtalinaed agingga a opisyal a natalged"],
      hil:["Mabaskog nga linog sa baybayon? MAGDALAGAN dayon","Kon nakita mo na ang balod, ulihi na","Magkadto sa pinakamataas nga maabot","Indi magbalik pagkatapos sang una nga balod","Magpabilin hasta opisyal nga luwas"],
      bik:["Makusog na linog sa baybayon? DALAGAN giraray","Pag nakita mo na an alon, atrasado na","Magduman sa pinakamataas na maabot","Dai magbalik pagkatapos kan inot na alon","Magdanay sagkod opisyal na ligtas na"],
      war:["Makusog nga linog ha baybayon? DAGAN dayon","Kun nakita mo na an dalum-ok, atrasado na","Kadto ha pinakamataas nga maabot","Diri magbalik pagkahuman han una nga dalum-ok","Pabilin tubtob opisyal nga salipdan"],
      pam:["Maragul a yanyan king pampang? TAKBO agad","Istung makit me ya ing alun, atras ne","Mako king pekamataas a lugal a maabot","Echi magbalik kaibat ning kanitang alun","Manatili anggang opisyal a maligtas"],
      pag:["Mabiskeg ya yanggayang ed gilig dayat? ONBATIK la tampol","No anengneng mo lay along, abagat la","Onla ed sankaatageyan ya magmaliw alaen","Ag onpawil kayari na sankasakey ya along","Manatili anggad opisyal lan mareen"],
      mag:["Mala a lugu ko ig? PHANGEDALAKAW IMANTO","Amay maylay ka ko alun, miyaori den","Song ko kapulayagan a darpa","Di phangondod ko miyaori o paganay a alun","Sa walai matatap taman ko opisyal a kalilintad"],
      tsg:["Hambuuk lupig ha baybay? DUMAGAN dayon","Bang naskag mu na in alun, lawum na","Sakat pa pinakamayan nga lugal","Ayaw pagbalik ubus sin paganay nga alun","Pabilin asal opisyal na halal"],
    },
    after:{
      en:["Multiple waves will follow — stay at high ground","Watch for debris and live wires in water","Wait for PHIVOLCS/NDRRMC all-clear","Report missing to Coast Guard and barangay","Seek mental health support if experiencing trauma"],
      tl:["Maraming alon ang darating — manatili sa mataas na lugar","Mag-ingat sa debris at kuryente sa tubig","Hintayin ang all-clear mula sa PHIVOLCS/NDRRMC","Iulat ang mga nawawala sa Coast Guard","Humingi ng mental health support kung may trauma"],
      ceb:["Daghang balod moabot pa — pabilin sa habog","Pag-amping sa debris ug kuryente sa tubig","Hulata ang all-clear gikan sa PHIVOLCS/NDRRMC","I-report ang nawala sa Coast Guard","Pangayo og mental health support kung naay trauma"],
      ilo:["Adu pay nga dalluyon ti umay — agtalinaed iti nangato","Agannad iti debris ken kuryente iti danum","Aguray ti all-clear manipud iti PHIVOLCS/NDRRMC","Ipadamag dagiti napukaw iti Coast Guard","Dumawat iti mental health support no adda trauma"],
      hil:["Madamo nga balod magaabot pa — magpabilin sa mataas","Mag-andam sa debris kag kuryente sa tubig","Hulata ang all-clear halin sa PHIVOLCS/NDRRMC","I-report ang nadula sa Coast Guard","Magpangayo sang mental health support kon may trauma"],
      bik:["Dakol na alon an madatong pa — magdanay sa mataas","Mag-ingat sa debris asin kuryente sa tubig","Hulaton an all-clear gikan sa PHIVOLCS/NDRRMC","I-report an nawawara sa Coast Guard","Maghagad nin mental health support kun may trauma"],
      war:["Damo nga dalum-ok an maabot pa — pabilin ha mataas","Pag-andam ha debris ngan kuryente ha tubig","Hulaton an all-clear tikang ha PHIVOLCS/NDRRMC","I-report an nawawara ha Coast Guard","Pangaro hin mental health support kun may trauma"],
      pam:["Maramdamang alun a magcha pa — manatili king mataas","Mag-ingat kareng debris at kuryente king danum","Asnan ya ing all-clear ibat king PHIVOLCS/NDRRMC","I-report la reng mawala king Coast Guard","Manyaman mental health support nung mika trauma"],
      pag:["Dakerakel ya along ya onsabi ni — manatili ed atagey","Manalwar ed debris tan koryente ed danum","Alagaren so all-clear ya manlapu ed PHIVOLCS/NDRRMC","I-report iray nababalang ed Coast Guard","Mikerew na mental health support no walay trauma"],
      mag:["Madakel a alun a phangomanan — sa walai matatap ko malayang darpa","Pagingat ko debris ago koryinti ko ig","Nayaw so all-clear a phoon ko PHIVOLCS/NDRRMC","I-report so manga nawawala ko Coast Guard","Pangenged sa mental health support amay adun trauma"],
      tsg:["Dakula nga alun in dumatung pa — pabilin ha malayu","Pag-ingat ha debris iban kuryente ha tubig","Hulata in all-clear dayn ha PHIVOLCS/NDRRMC","I-report in nawala pa Coast Guard","Mangayu mental health support bang awn trauma"],
    }},

  { id:"landslide", icon:"⛰", name:{en:"Landslide",tl:"Landslide",ceb:"Pagkahugno",ilo:"Panagdalusay ti Daga",hil:"Pagtap-ok sang Duta",bik:"Pagkahulog nin Daga",war:"Pagkahugno han Tuna",pam:"Karenas",pag:"Panagdarakdarak",mag:"Kagubo o Lupa",tsg:"Pagtigkis"},
    levels:{
      en:[{label:"Advisory",desc:"Landslide possible in steep areas."},{label:"Warning",desc:"Prolonged heavy rain. Avoid mountains and cliffs."},{label:"Critical",desc:"Active landslide. Evacuate immediately."}],
      tl:[{label:"Advisory",desc:"Maaaring mag-landslide sa mga matarik na lugar."},{label:"Warning",desc:"Matagal na malakas na ulan. Lumayo sa bundok at bangin."},{label:"Critical",desc:"Aktibong landslide. Mag-evacuate agad."}],
      ceb:[{label:"Advisory",desc:"Posibling mahugno sa pig-ot nga lugar."},{label:"Warning",desc:"Tag-as nga kusog nga ulan. Layo sa bukid ug pangpang."},{label:"Critical",desc:"Aktibong pagkahugno. Mag-evacuate dayon."}],
      ilo:[{label:"Advisory",desc:"Mabalin a dumalusay ti daga iti agdadakkel a turod."},{label:"Warning",desc:"Nabayag a napigsa a tudo. Adayo iti bantay ken derraas."},{label:"Critical",desc:"Aktibo a pannakadalusay ti daga. Agevacuate a dagus."}],
      hil:[{label:"Advisory",desc:"Posible magtap-ok ang duta sa mataas nga lugar."},{label:"Warning",desc:"Madugay nga mabaskog nga ulan. Magpalayo sa bukid kag banglid."},{label:"Critical",desc:"Aktibo nga pagtap-ok sang duta. Mag-evacuate dayon."}],
      bik:[{label:"Advisory",desc:"Posibleng magkahulog an daga sa mga harapit na lugar."},{label:"Warning",desc:"Halawig na makusog na uran. Harayo sa bukid asin pangpang."},{label:"Critical",desc:"Aktibong pagkahulog kan daga. Mag-evacuate giraray."}],
      war:[{label:"Advisory",desc:"Posible mahugno an tuna ha hadap nga lugar."},{label:"Warning",desc:"Maiha nga makusog nga uran. Hirayo ha bukid ngan banglid."},{label:"Critical",desc:"Aktibo nga pagkahugno han tuna. Mag-evacuate dayon."}],
      pam:[{label:"Advisory",desc:"Malyari magkareta ya gabun king mababatak a lugal."},{label:"Warning",desc:"Matagal a maragul a uran. Magpalaut king bunduk at bangin."},{label:"Critical",desc:"Aktibung karenas. Mag-evacuate agad."}],
      pag:[{label:"Advisory",desc:"Nayarin onlogos so dalin ed atagtagey ya lugar."},{label:"Warning",desc:"Andukey ya mabiskeg ya uran. Arawi ed palandey tan banglid."},{label:"Critical",desc:"Aktibo ya panagdarakdarak. Mag-evacuate la tampol."}],
      mag:[{label:"Advisory",desc:"Mbaling makaplag so lupa ko matatas a darpa."},{label:"Warning",desc:"Maito a mawatan a oran. Mawatan ko palaw ago kanal."},{label:"Critical",desc:"Aktibo a kagubo o lupa. Pangampang ko mapulu."}],
      tsg:[{label:"Advisory",desc:"Mahimu magtigkis in lupa' ha matarik nga lugal."},{label:"Warning",desc:"Malugay nga mabug'at nga ulan. Magpalayu ha bukid iban gulang."},{label:"Critical",desc:"Aktibo nga pagtigkis sin lupa'. Pag'alas dayon."}],
    },
    before:{
      en:["Know if you live near steep slopes or rivers","Watch for ground or wall cracks","Don't build at the foot of steep mountains","Plan escape routes away from rivers","Watch for leaning or shifting trees"],
      tl:["Alamin kung nasa landslide-prone area ka","Bantayan ang mga crack sa lupa o dingding","Huwag magtayo sa ilalim ng matarik na bundok","Planuhin ang mga escape routes malayo sa mga ilog","Mag-ingat sa mga puno na nakahilig"],
      ceb:["Hibaloi kung duol sa pig-ot nga bakilid o suba ang inyong puy-anan","Bantayi ang mga liki sa yuta o dingding","Ayaw pagtukod sa ubos sa pig-ot nga bukid","Planuhi ang escape routes layo sa mga suba","Bantayi ang mga kahoy nga nag-iduko"],
      ilo:["Ammuen no asidegka iti turod wenno karayan","Bantayan dagiti pagbettak ti daga wenno pader","Saan nga agpatakder iti sirok ti turod","Plano dagiti escape routes nga adayo iti karayan","Bantayan dagiti kayo nga aglinged"],
      hil:["Tun-i kon malapit ka sa banglid ukon suba","Bantayi ang mga gisi sa duta ukon dingding","Indi magtukod sa idalom sang banglid","Planuha ang escape routes malayo sa mga suba","Bantayi ang mga kahoy nga nagatikuyo"],
      bik:["Maaraman kun harani ka sa pangpang o salog","Bantayan an mga hiwas sa daga o pader","Dai magtugdok sa ilalom kan pangpang","Plano an escape routes harayo sa mga salog","Bantayan an mga kahoy na nagsasandig"],
      war:["Hibaroa kun hirani ka ha banglid o salog","Bantayi an mga gisi ha tuna o pader","Diri magtukod ha ilarom han banglid","Plano an escape routes hirayo ha mga salog","Bantayi an mga kahoy nga nagtitikang"],
      pam:["Akilala nu malapit ka king bangin o ilug","Bantayan deng karenas king gabun o dingding","Echi mag-tibe king lalam na bangin","Pamlanu reng escape routes a magpalaut king ilug","Bantayan deng dutung a mengakuko"],
      pag:["Amtaen no asingger ka ed banglid o ilog","Bantayan iray crack ed dalin o dakdak","Ag manggawa ed leksab na banglid","Pamlano iray escape routes ya arawi ed ilog","Bantayan iray kiew ya manga-eebew"],
      mag:["Kataw-i amay marani ka ko bangin atawa lawasaig","Pagilaya so manga karenas ko lupa atawa padir","Di phamagaley ko sirong o bangin","Plano so manga escape routes a mawatan ko lawasaig","Pagilaya so manga kayo a magkakaykay"],
      tsg:["Kaingatan bang malapit kaw ha gulang atawa suba'","Pamatihay in manga gisi ha lupa' atawa pader","Ayaw pagbangun ha ibaba sin gulang","Pagplano in escape routes magpalayu ha manga suba'","Pamatihay in manga kahoy nga mauntul"],
    },
    during:{
      en:["Loud roar from the mountain? Move now","Run sideways — not in line with the flow","If trapped, go to the highest floor","Don't cross rivers if there's a landslide upstream","Sound is your warning — evacuate before you see it"],
      tl:["Malakas na tunog mula sa bundok? Lumipat na","Tumakbo sa tabi — hindi sa harap o likod ng daloy","Kung hindi makaalis, pumunta sa pinakamataas na palapag","Huwag tumawid sa ilog kung may landslide sa itaas","Ang tunog ang babala mo — mag-evacuate bago pa makita"],
      ceb:["Kusog nga tingog gikan sa bukid? Balhin na dayon","Dagan sa kilid — dili sa atubangan o luyo sa agos","Kung wala kabalhin, adto sa pinakahabog nga andana","Ayaw tabok sa suba kung naay landslide sa taas","Ang tingog ang ilhanan nimo — mag-evacuate sa dili pa makita"],
      ilo:["Napigsa a kuting manipud iti bantay? Agakar itan","Agtaray iti sikigan — saan iti sango wenno likudan ti agayos","No saan a makastrek, mapan iti kangangatuan a tukad","Saan a bumallasiw iti karayan no adda dalusay iti ngato","Ti uni ti ballaagmo — agevacuate sakbay a makitam"],
      hil:["Mabaskog nga tunog halin sa bukid? Maglipat na","Magdalagan sa kilid — indi sa atubangan ukon sa likod sang agos","Kon indi makahalin, magkadto sa pinakamataas nga andana","Indi magtabok sa suba kon may landslide sa ibabaw","Ang tunog ang paandam mo — mag-evacuate antes makita"],
      bik:["Makusog na tanog gikan sa bukid? Maglihis na","Magdalagan sa kilid — bako sa atubangan o likod kan agos","Kun dai makaluwas, magsakat sa pinakamataas na andana","Dai magbalyo sa salog kun may landslide sa itaas","An tanog an ilang sa saimo — mag-evacuate bago maheling"],
      war:["Makusog nga tunog tikang ha bukid? Maglihis na","Dagan ha kilid — diri ha atubangan o luyo han agos","Kun diri makagawas, sakat ha pinakamataas nga andana","Diri magtabok ha salog kun may landslide ha igbaw","An tunog imo pahamatngon — mag-evacuate antes makita"],
      pam:["Maragul a kalkag king bunduk? Magpalit na","Takbo king gilid — ali king arapan o gulutan na ing dalan na danum","Nung ali makalual, mako king pekamataas a astaga","Echi magtabuk king ilug nung mika karenas king babo","Ing kalkag ya pasibul mu — mag-evacuate bayu makit me"],
      pag:["Mabiskeg ya tagel a manlapu ed palandey? Onalis la","Onbatik ed gilig — ag ed arap onla legan ed gilig na dalakgey","No ag makaonla, onla ed sankaatageyan ya andana","Ag ontabok ed ilog no walay panagdarakdarak ed tagey","Say tagel so pasakbay mo — mag-evacuate antis ya naimatonan"],
      mag:["Mala a tingug a phoon ko palaw? Awa imanto","Pangedalakaw sa kilid — di ko onaan atawa kililid o lalakaw","Amay di kagaga lima, song ko kapulayagan a andana","Di phanabor ko lawasaig amay adun kagubo lupa ko poro","So tingug i pamakasabut ruka — pangampang ko di pa kailay"],
      tsg:["Hambuuk delikado nga sahul dayn ha bukid? Lipat na","Dumagan ha kilid — di ha atubang atawa ha gulang sin agus","Bang di makahawa, sakat pa pinakamayan nga andana","Ayaw lumabang ha suba' bang awn pagtigkis ha taas","In sahul amura in hindu kaymu — pag'alas ubus mu makita'"],
    },
    after:{
      en:["Don't return — a second slide may follow","Watch for new cracks nearby","Report trapped persons to NDRRMC","Don't drink water from affected rivers","Join barangay clearing operations safely"],
      tl:["Huwag bumalik — maaaring may isa pang landslide","Bantayan ang mga bagong crack sa paligid","Iulat ang mga naka-entrap sa NDRRMC","Huwag uminom ng tubig mula sa mga apektadong ilog","Makiisa sa barangay clearing operations nang ligtas"],
      ceb:["Ayaw pagbalik — posible naay sunod nga pagkahugno","Bantayi ang bag-ong mga liki sa palibot","I-report ang naka-entrap sa NDRRMC","Ayaw pag-inom og tubig gikan sa apektadong suba","Apil sa barangay clearing operations nga luwas"],
      ilo:["Saan nga agsubli — mabalin nga adda manarunong a pannakadalusay","Bantayan dagiti baro a pagbettak iti aglawlaw","Ipadamag dagiti naipenpen iti NDRRMC","Saan nga uminum iti danum manipud iti naapektaran a karayan","Tumulong iti barangay clearing operations a natalged"],
      hil:["Indi magbalik — posible may sunod nga pagtap-ok","Bantayi ang bag-o nga mga gisi sa palibot","I-report ang naka-entrap sa NDRRMC","Indi mag-inom sang tubig halin sa naapektohan nga suba","Magbulig sa barangay clearing operations nga luwas"],
      bik:["Dai magbalik — posibleng may masunod na pagkahulog","Bantayan an bagong mga hiwas sa palibot","I-report an mga nakulong sa NDRRMC","Dai mag-inom nin tubig gikan sa apektadong salog","Magtabang sa barangay clearing operations na ligtas"],
      war:["Diri magbalik — posible may sunod nga pagkahugno","Bantayi an bag-o nga mga gisi ha palibot","I-report an mga nakulong ha NDRRMC","Diri mag-inom hin tubig tikang ha naapektaran nga salog","Pag-upod ha barangay clearing operations nga salipdan"],
      pam:["Echi mibalik — malyari mika kasunuran a karenas","Bantayan deng bayung karenas king palibud","I-report la reng nakulong king NDRRMC","Echi minum danum ibat king inapektuan ilug","Makisali king barangay clearing operations a maligtas"],
      pag:["Ag onpawil — nayarin walay onsublay ya panagdarakdarak","Bantayan iray balon crack ed kaliberliber","I-report iray akulong ed NDRRMC","Ag oninum na danum ed naapektoan ya ilog","Mibiang ed barangay clearing operations a mareen"],
      mag:["Di phangondod — mbaling adun pomonan a kagubo","Pagilaya so manga bago a karenas ko liyawaw","I-report so manga miyakulong ko NDRRMC","Di phaginom na ig a phoon ko naapektaran a lawasaig","Pagayonayon ko barangay clearing operations a malilintad"],
      tsg:["Ayaw magbalik — mahimu awn humambuuk pa pagtigkis","Pamatihay in bagu nga manga gisi ha hawagis","I-report in nakulong pa NDRRMC","Ayaw paginum tubig dayn ha naapektaran nga suba'","Pag-upud ha barangay clearing operations nga halal"],
    }},
];

const DEFAULT_GOBAG = {
  en:["Valid ID + document copies (waterproof bag)","3-day food supply — canned goods, crackers","3 liters of water per person per day","Maintenance medicine — 1 week supply","First aid kit — bandage, alcohol, betadine","Flashlight + spare batteries or dynamo","Battery-operated or hand-crank radio","Fully charged power bank","Extra clothes and a blanket","Whistle — to signal if trapped","Cash in a waterproof bag","N95 masks — at least 5 pieces"],
  tl:["Valid ID + kopya ng mga dokumento (waterproof bag)","3-araw na pagkain — de-lata, crackers","3 litro ng tubig per tao bawat araw","Maintenance medicine — 1 linggong supply","First aid kit — bandage, alcohol, betadine","Flashlight + spare batteries o dynamo","Battery-operated o hand-crank na radyo","Power bank na puno ang charge","Extra damit at kumot","Whistol — para mag-signal kung na-trap","Cash sa waterproof bag","N95 masks — kahit 5 piraso"],
  ceb:["Valid ID + kopya sa mga dokumento (waterproof bag)","3 ka adlaw nga suplay sa pagkaon — de-lata, crackers","3 litro nga tubig sa tagsa ka tawo kada adlaw","Maintenance nga tambal — 1 semana nga suplay","First aid kit — bandage, alkohol, betadine","Flashlight + dugang baterya o dynamo","Radyo nga battery o hand-crank","Pun-on og charge ang power bank","Dugang sinina ug habol","Pito — para mag-signal kung na-trap","Kuwarta sa waterproof bag","N95 masks — labing menos 5 ka piraso"],
  ilo:["Valid ID + kopya dagiti dokumento (waterproof bag)","3 nga aldaw a suplay ti taraon — de-lata, crackers","3 litro ti danum iti tunggal maysa nga aldaw","Agas a maintenance — 1 lawas a suplay","First aid kit — bendahe, alkohol, betadine","Flashlight + sukat a baterya wenno dynamo","Radio nga battery wenno hand-crank","Napno a charge ti power bank","Sukat a kawes ken ules","Pito — tapno agpaadda no na-trap","Kuwarta iti waterproof bag","N95 masks — saan nga umurat iti 5 a piraso"],
  hil:["Valid ID + kopya sang mga dokumento (waterproof bag)","3 ka adlaw nga suplay sang pagkaon — de-lata, crackers","3 litro nga tubig sa kada tawo adlaw-adlaw","Maintenance nga bulong — 1 semana nga suplay","First aid kit — bendahe, alkohol, betadine","Flashlight + dugang baterya ukon dynamo","Radyo nga battery ukon hand-crank","Puno nga charge nga power bank","Dugang bayo kag habol","Pito — para magsignal kon na-trap","Kuwarta sa waterproof bag","N95 masks — bisan 5 ka piraso"],
  bik:["Valid ID + kopya kan mga dokumento (waterproof bag)","3 na aldaw na suplay nin kakanon — de-lata, crackers","3 litro nin tubig sa kada saro aroaldaw","Maintenance na bulong — 1 semana na suplay","First aid kit — bendahe, alkohol, betadine","Flashlight + dagdag baterya o dynamo","Radyo na battery o hand-crank","Pano na charge an power bank","Dagdag gubing asin kumot","Pito — para magsignal kun na-trap","Kuwarta sa waterproof bag","N95 masks — kahit 5 na piraso"],
  war:["Valid ID + kopya han mga dokumento (waterproof bag)","3 ka adlaw nga suplay han pagkaon — de-lata, crackers","3 litro nga tubig para han tagsa kaadlaw","Maintenance nga bulong — 1 semana nga suplay","First aid kit — bendahe, alkohol, betadine","Flashlight + dugang baterya o dynamo","Radyo nga battery o hand-crank","Puno nga charge nga power bank","Dugang bado ngan kumot","Pito — para magsignal kun na-trap","Kuwarta ha waterproof bag","N95 masks — bisan 5 ka piraso"],
  pam:["Valid ID + kopya da reng dokumento (waterproof bag)","3 aldo a suplay ning pamangan — de-lata, crackers","3 litro a danum king balang metung aldo-aldo","Maintenance a gamut — 1 simana a suplay","First aid kit — bendahe, alkohol, betadine","Flashlight + dagul baterya o dynamo","Radyo a battery o hand-crank","Punung charge ya ing power bank","Dagul damit at kumot","Pito — para mag-signal nung na-trap","Kuarta king waterproof bag","N95 masks — anggiyang 5 piraso"],
  pag:["Valid ID + kopya na dokumento (waterproof bag)","3 agew ya suplay na naakan — de-lata, crackers","3 litro na danum ed kada sakey kada agew","Maintenance ya agas — 1 simba ya suplay","First aid kit — bendahe, alkohol, betadine","Flashlight + add ya baterya o dynamo","Radyo ya battery o hand-crank","Napno ya charge so power bank","Add ya kawes tan ules","Pito — pian onsignal no na-trap","Kuarta ed waterproof bag","N95 masks — anggan 5 piraso"],
  mag:["Valid ID + kopya o manga dokumento (waterproof bag)","3 gawii a suplay o kanon — de-lata, crackers","3 litro a ig ko oman isa oman gawii","Maintenance a ubat — 1 dominggo a suplay","First aid kit — bendahe, alkohol, betadine","Flashlight + dagaduwa baterya atawa dynamo","Radyo a battery atawa hand-crank","Napuno a charge so power bank","Dagaduwa bayo ago kumut","Pito — ko phakatanda amay matrap","Kwarta ko waterproof bag","N95 masks — apya 5 piraso"],
  tsg:["Valid ID + kopya sin manga dokumento (waterproof bag)","3 ka adlaw nga suplay sin kakaun — de-lata, crackers","3 litro tubig kada tau kada adlaw","Maintenance nga tambal — 1 simana nga suplay","First aid kit — bendahe, alkohol, betadine","Flashlight + dugang baterya atawa dynamo","Radyo battery atawa hand-crank","Puno' nga charge in power bank","Dugang sapun iban hambal","Pito — para magsignal bang na-trap","Sīn ha waterproof bag","N95 masks — minimum 5 ka piraso"],
};

const HOTLINES = [
  {name:"NDRRMC",       number:"911",              dial:"911",           desc:{en:"National Emergency",tl:"Pambansang Emergency",ceb:"Pambansang Emergency",ilo:"Nasional nga Emergency",hil:"Pambansa nga Emergency",bik:"Pambansang Emergency",war:"Pambansa nga Emergency",pam:"Pambansang Emergency",pag:"Pambansan Emergency",mag:"Pambansa a Emergency",tsg:"Pambansa nga Emergency"}},
  {name:"PAGASA",       number:"(02) 8284-0800",   dial:"0282840800",    desc:{en:"Weather & Typhoon",tl:"Panahon at Bagyo",ceb:"Panahon ug Bagyo",ilo:"Tiempo ken Bagyo",hil:"Panahon kag Bagyo",bik:"Panahon asin Bagyo",war:"Panahon ngan Bagyo",pam:"Panahon at Bagyu",pag:"Panahon tan Bagyo",mag:"Wakto ago Bagyo",tsg:"Hawa-Hawa iban Bagyu"}},
  {name:"PHIVOLCS",     number:"(02) 8426-1468",   dial:"0284261468",    desc:{en:"Earthquake & Volcano",tl:"Lindol at Bulkan",ceb:"Linog ug Bulkan",ilo:"Gingined ken Bolkan",hil:"Linog kag Bulkan",bik:"Linog asin Bulkan",war:"Linog ngan Bulkan",pam:"Yanyan at Bulkan",pag:"Yanggayang tan Bulkan",mag:"Lugu ago Bulkan",tsg:"Lupig iban Bulkan"}},
  {name:"Red Cross PH", number:"143",              dial:"143",           desc:{en:"Emergency Medical",tl:"Emergency Medikal",ceb:"Emergency Medikal",ilo:"Emergency Medikal",hil:"Emergency Medikal",bik:"Emergency Medikal",war:"Emergency Medikal",pam:"Emergency Medikal",pag:"Emergency Medikal",mag:"Emergency Medikal",tsg:"Emergency Medikal"}},
  {name:"Coast Guard",  number:"(02) 8527-3877",   dial:"0285273877",    desc:{en:"Maritime & Tsunami",tl:"Dagat at Tsunami",ceb:"Dagat ug Tsunami",ilo:"Baybay ken Tsunami",hil:"Dagat kag Tsunami",bik:"Dagat asin Tsunami",war:"Dagat ngan Tsunami",pam:"Dagat at Tsunami",pag:"Dayat tan Tsunami",mag:"Ragat ago Tsunami",tsg:"Dagat iban Tsunami"}},
  {name:"DSWD",         number:"1-800-100-DSWD",   dial:"18001003793",   desc:{en:"Disaster Relief",tl:"Relief at Tulong",ceb:"Relief ug Tabang",ilo:"Relief ken Tulong",hil:"Relief kag Bulig",bik:"Relief asin Tabang",war:"Relief ngan Bulig",pam:"Relief at Saup",pag:"Relief tan Tulong",mag:"Relief ago Tabang",tsg:"Relief iban Tabang"}},
];

const EVAC_DB = [
  {region:"NCR",city:"Manila",name:"Rizal Memorial Sports Complex",address:"Pablo Ocampo Sr. St, Malate, Manila",type:"Sports Complex",capacity:"5,000+",lat:14.5561,lng:120.9893},
  {region:"NCR",city:"Manila",name:"Cuneta Astrodome",address:"EDSA cor. Arsenia St, Pasay",type:"Astrodome",capacity:"4,000+",lat:14.5567,lng:121.0014},
  {region:"NCR",city:"Manila",name:"Rajah Sulayman Grandstand",address:"Fort Santiago, Intramuros, Manila",type:"Grandstand",capacity:"3,000+",lat:14.5942,lng:120.9718},
  {region:"NCR",city:"Quezon City",name:"Quezon Memorial Circle",address:"Elliptical Rd, Diliman, Quezon City",type:"Open Area",capacity:"10,000+",lat:14.6516,lng:121.0436},
  {region:"NCR",city:"Quezon City",name:"Amoranto Sports Complex",address:"Amoranto Ave, Quezon City",type:"Sports Complex",capacity:"3,000+",lat:14.6407,lng:121.0069},
  {region:"NCR",city:"Makati",name:"Makati Coliseum",address:"Vito Cruz Extension, Makati",type:"Coliseum",capacity:"5,000+",lat:14.5519,lng:121.0182},
  {region:"NCR",city:"Pasig",name:"Pasig City Sports Center",address:"F. Legaspi St, Pasig City",type:"Sports Complex",capacity:"2,000+",lat:14.5764,lng:121.0851},
  {region:"NCR",city:"Taguig",name:"Signal Village National High School",address:"Signal Village, Taguig",type:"School",capacity:"1,000+",lat:14.5200,lng:121.0530},
  {region:"NCR",city:"Marikina",name:"Marikina Sports Center",address:"Shoe Ave, Marikina City",type:"Sports Complex",capacity:"3,000+",lat:14.6507,lng:121.1029},
  {region:"NCR",city:"Valenzuela",name:"Valenzuela Astrodome",address:"McArthur Hwy, Valenzuela City",type:"Astrodome",capacity:"5,000+",lat:14.7011,lng:120.9830},
  {region:"NCR",city:"Caloocan",name:"Caloocan Sports Complex",address:"10th Ave, Caloocan City",type:"Sports Complex",capacity:"2,000+",lat:14.6498,lng:120.9720},
  {region:"NCR",city:"Parañaque",name:"Parañaque City Sports Complex",address:"BF Homes, Parañaque City",type:"Sports Complex",capacity:"2,000+",lat:14.4793,lng:121.0198},
  {region:"Region I",city:"Laoag",name:"Laoag City Sports Complex",address:"Laoag City, Ilocos Norte",type:"Sports Complex",capacity:"2,000+",lat:18.1977,lng:120.5937},
  {region:"Region I",city:"Vigan",name:"Plaza Salcedo",address:"Vigan City, Ilocos Sur",type:"Open Area",capacity:"2,000+",lat:17.5747,lng:120.3870},
  {region:"Region I",city:"Dagupan",name:"Dagupan City Gymnasium",address:"AB Fernandez Ave, Dagupan",type:"Gymnasium",capacity:"2,000+",lat:16.0430,lng:120.3333},
  {region:"Region II",city:"Tuguegarao",name:"Tuguegarao City Sports Complex",address:"Tuguegarao City, Cagayan",type:"Sports Complex",capacity:"2,000+",lat:17.6132,lng:121.7270},
  {region:"Region II",city:"Santiago",name:"Santiago City Sports Complex",address:"Santiago City, Isabela",type:"Sports Complex",capacity:"2,000+",lat:16.6877,lng:121.5503},
  {region:"Region III",city:"San Fernando",name:"Pampanga Sports Complex",address:"Jose Abad Santos Ave, San Fernando",type:"Sports Complex",capacity:"5,000+",lat:15.0285,lng:120.6890},
  {region:"Region III",city:"Angeles",name:"Angeles City Sports Complex",address:"Sto. Rosario St, Angeles City",type:"Sports Complex",capacity:"3,000+",lat:15.1450,lng:120.5887},
  {region:"Region III",city:"Tarlac City",name:"Tarlac Sports Complex",address:"MacArthur Hwy, Tarlac City",type:"Sports Complex",capacity:"3,000+",lat:15.4755,lng:120.5963},
  {region:"Region III",city:"Cabanatuan",name:"Cabanatuan Sports Complex",address:"Burgos Ave, Cabanatuan City",type:"Sports Complex",capacity:"2,000+",lat:15.4866,lng:120.9669},
  {region:"Region IV-A",city:"Antipolo",name:"Antipolo Sports Complex",address:"M.L. Quezon Ave, Antipolo",type:"Sports Complex",capacity:"2,000+",lat:14.5862,lng:121.1748},
  {region:"Region IV-A",city:"Batangas City",name:"Batangas City Coliseum",address:"JP Laurel Hwy, Batangas City",type:"Coliseum",capacity:"3,000+",lat:13.7565,lng:121.0583},
  {region:"Region IV-A",city:"Calamba",name:"Calamba Sports Complex",address:"Real St, Calamba, Laguna",type:"Sports Complex",capacity:"2,000+",lat:14.2115,lng:121.1653},
  {region:"Region IV-A",city:"Lucena",name:"Quezon Convention Center",address:"Quezon Ave, Lucena City",type:"Convention Center",capacity:"3,000+",lat:13.9373,lng:121.6170},
  {region:"Region V",city:"Legazpi",name:"Legazpi City Sports Complex",address:"Washington Drive, Legazpi City",type:"Sports Complex",capacity:"3,000+",lat:13.1391,lng:123.7438},
  {region:"Region V",city:"Naga",name:"Naga City Sports Complex",address:"Triangulo, Naga City",type:"Sports Complex",capacity:"3,000+",lat:13.6218,lng:123.1945},
  {region:"Region V",city:"Sorsogon",name:"Sorsogon City Gymnasium",address:"Magsaysay St, Sorsogon City",type:"Gymnasium",capacity:"1,500+",lat:12.9742,lng:124.0058},
  {region:"Region VI",city:"Iloilo City",name:"Iloilo Sports Complex",address:"Benigno Aquino Ave, Iloilo City",type:"Sports Complex",capacity:"5,000+",lat:10.7202,lng:122.5621},
  {region:"Region VI",city:"Bacolod",name:"Bacolod City Sports Complex",address:"BS Aquino Drive, Bacolod City",type:"Sports Complex",capacity:"5,000+",lat:10.6402,lng:122.9822},
  {region:"Region VII",city:"Cebu City",name:"Cebu City Sports Complex",address:"Osmena Blvd, Cebu City",type:"Sports Complex",capacity:"8,000+",lat:10.3000,lng:123.8934},
  {region:"Region VII",city:"Mandaue",name:"Mandaue City Sports Complex",address:"A.C. Cortes Ave, Mandaue",type:"Sports Complex",capacity:"3,000+",lat:10.3236,lng:123.9223},
  {region:"Region VII",city:"Lapu-Lapu",name:"Lapu-Lapu City Coliseum",address:"Pusok, Lapu-Lapu City",type:"Coliseum",capacity:"3,000+",lat:10.3103,lng:123.9494},
  {region:"Region VII",city:"Dumaguete",name:"Silliman University Courts",address:"Hibbard Ave, Dumaguete City",type:"School",capacity:"2,000+",lat:9.3103,lng:123.3081},
  {region:"Region VIII",city:"Tacloban",name:"Tacloban City Astrodome",address:"Justice Romualdez St, Tacloban",type:"Astrodome",capacity:"5,000+",lat:11.2543,lng:124.9973},
  {region:"Region VIII",city:"Ormoc",name:"Ormoc City Sports Complex",address:"Cogon District, Ormoc City",type:"Sports Complex",capacity:"2,000+",lat:11.0050,lng:124.6076},
  {region:"Region IX",city:"Zamboanga City",name:"JF Enriquez Memorial Sports Complex",address:"Veteran's Ave, Zamboanga City",type:"Sports Complex",capacity:"5,000+",lat:6.9214,lng:122.0790},
  {region:"Region X",city:"Cagayan de Oro",name:"Pelagio Aplaya Sports Complex",address:"Velez St, Cagayan de Oro",type:"Sports Complex",capacity:"5,000+",lat:8.4822,lng:124.6472},
  {region:"Region X",city:"Iligan",name:"Iligan City Sports Complex",address:"Gen. Paulino Santos Ave, Iligan",type:"Sports Complex",capacity:"3,000+",lat:8.2280,lng:124.2452},
  {region:"Region XI",city:"Davao City",name:"San Pedro Sports Complex",address:"Ilustre St, Davao City",type:"Sports Complex",capacity:"5,000+",lat:7.0731,lng:125.6128},
  {region:"Region XI",city:"Tagum",name:"Tagum City Sports Complex",address:"Tagum City, Davao del Norte",type:"Sports Complex",capacity:"2,000+",lat:7.4478,lng:125.8078},
  {region:"Region XII",city:"General Santos",name:"General Santos Sports Complex",address:"Pioneer Ave, General Santos City",type:"Sports Complex",capacity:"5,000+",lat:6.1128,lng:125.1717},
  {region:"Region XII",city:"Cotabato City",name:"Cotabato City Sports Complex",address:"Makakua St, Cotabato City",type:"Sports Complex",capacity:"2,000+",lat:7.2236,lng:124.2530},
  {region:"CAR",city:"Baguio",name:"Baguio City Athletic Bowl",address:"Leonard Wood Rd, Baguio City",type:"Sports Complex",capacity:"5,000+",lat:16.4116,lng:120.5930},
  {region:"BARMM",city:"Cotabato",name:"Shariff Kabunsuan Cultural Complex",address:"Don Rufino Alonzo St, Cotabato City",type:"Cultural Complex",capacity:"3,000+",lat:7.2167,lng:124.2500},
];

const REGIONS = ["All",...Array.from(new Set(EVAC_DB.map(e=>e.region))).sort()];

// ─── SVG Icons ────────────────────────────────────────────────────
const Ico = {
  back:    <svg width="9" height="16" viewBox="0 0 9 16" fill="none"><path d="M8 1L1 8L8 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  check:   <svg width="12" height="9" viewBox="0 0 12 9" fill="none"><path d="M1 4.5L4.5 8L11 1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  plus:    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><line x1="7" y1="1" x2="7" y2="13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><line x1="1" y1="7" x2="13" y2="7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  trash:   <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1.5 3.5h11M5 3.5V2.5a.5.5 0 01.5-.5h3a.5.5 0 01.5.5v1M11.5 3.5l-.8 8.2a.5.5 0 01-.5.3H3.8a.5.5 0 01-.5-.3L2.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  edit:    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9.5 2.5l2 2L4 12H2v-2L9.5 2.5z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  search:  <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.6"/><path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  pin:     <svg width="12" height="14" viewBox="0 0 12 14" fill="none"><path d="M6 13s5-4.5 5-7.5a5 5 0 00-10 0C1 8.5 6 13 6 13z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/><circle cx="6" cy="5.5" r="1.5" stroke="currentColor" strokeWidth="1.4"/></svg>,
  // Nav — Apple-style thin strokes
  navHome: <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V10.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M9 21V13h6v8" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>,
  navBag:  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M6 2L3 7v14a1 1 0 001 1h16a1 1 0 001-1V7L18 2H6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><line x1="3" y1="7" x2="21" y2="7" stroke="currentColor" strokeWidth="1.5"/><path d="M16 11a4 4 0 01-8 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  navPhone:<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 014.69 12 19.79 19.79 0 011.61 3.38 2 2 0 013.59 1.18h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L7.91 8.72a16 16 0 006.37 6.37l.91-.91a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>,
  navEvac: <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><polyline points="9 22 9 12 15 12 15 22" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>,
  shield:  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>,
  maps:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.6"/></svg>,
  phone:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 014.69 12 19.79 19.79 0 011.61 3.38 2 2 0 013.59 1.18h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L7.91 8.72a16 16 0 006.37 6.37l.91-.91a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>,
  expand:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M8 3H5a2 2 0 00-2 2v3M16 3h3a2 2 0 012 2v3M21 16v3a2 2 0 01-2 2h-3M3 16v3a2 2 0 002 2h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  close:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
};

// ─── Glass card style helper ──────────────────────────────────────
const glassCard = (extra={}) => ({
  background: glass.card,
  backdropFilter: "blur(20px) saturate(180%)",
  WebkitBackdropFilter: "blur(20px) saturate(180%)",
  border: `1px solid ${glass.border}`,
  borderRadius: 20,
  ...extra,
});

// ─── Lang Toggle ──────────────────────────────────────────────────
function LangToggle({ lang, setLang }) {
  const [showPicker, setShowPicker] = useState(false);
  const isPH = lang !== "en";
  const currentPH = PH_LANGS.find(l=>l.code===lang) || PH_LANGS[0];

  return (
    <>
      <div style={{...glassCard(), display:"flex", padding:3, gap:2, borderRadius:12}}>
        <button onClick={()=>setLang("en")} style={{
          padding:"5px 14px", borderRadius:10, border:"none",
          background: lang==="en" ? "rgba(255,255,255,0.22)" : "transparent",
          color: lang==="en" ? glass.white : glass.textSecond,
          fontWeight: lang==="en" ? 600 : 400,
          fontSize:12, cursor:"pointer", letterSpacing:0.8, fontFamily:font,
          transition:"all 0.2s",
        }}>EN</button>
        <button onClick={()=> isPH ? setShowPicker(true) : setLang("tl")} style={{
          padding:"5px 14px", borderRadius:10, border:"none",
          background: isPH ? "rgba(255,255,255,0.22)" : "transparent",
          color: isPH ? glass.white : glass.textSecond,
          fontWeight: isPH ? 600 : 400,
          fontSize:12, cursor:"pointer", letterSpacing:0.8, fontFamily:font,
          transition:"all 0.2s", display:"flex", alignItems:"center", gap:4,
        }}>
          PH{isPH && <span style={{fontSize:9, opacity:0.75, fontWeight:500}}>· {currentPH.label}</span>}
        </button>
      </div>

      {showPicker && (
        <div onClick={()=>setShowPicker(false)} style={{
          position:"fixed", top:0, left:0, right:0, bottom:0, zIndex:998,
          background:"rgba(5,8,14,0.78)",
          display:"flex", alignItems:"flex-end", justifyContent:"center",
          maxWidth:430, margin:"0 auto",
        }}>
          <div onClick={e=>e.stopPropagation()} style={{
            background:"#0F1923", borderTop:"1px solid rgba(255,255,255,0.14)",
            borderRadius:"24px 24px 0 0", width:"100%", maxHeight:"75vh",
            overflowY:"auto", padding:"20px 20px 30px",
          }}>
            <div style={{width:36, height:4, borderRadius:4, background:"rgba(255,255,255,0.2)", margin:"0 auto 16px"}}/>
            <div style={{color:"#FFFFFF", fontWeight:700, fontSize:17, fontFamily:font, marginBottom:4}}>Piliin ang Wika</div>
            <div style={{color:"rgba(255,255,255,0.5)", fontSize:12, marginBottom:16}}>Choose a Philippine language</div>

            <div style={{display:"flex", flexDirection:"column", gap:6}}>
              {PH_LANGS.map(l=>(
                <button key={l.code} onClick={()=>{ setLang(l.code); setShowPicker(false); }} style={{
                  display:"flex", justifyContent:"space-between", alignItems:"center",
                  width:"100%", textAlign:"left", cursor:"pointer",
                  background: lang===l.code ? "rgba(243,156,18,0.15)" : "#141E2A",
                  border: lang===l.code ? "1px solid rgba(243,156,18,0.35)" : "1px solid rgba(255,255,255,0.08)",
                  borderRadius:12, padding:"12px 14px",
                }}>
                  <div>
                    <div style={{color:"#F0F4F8", fontWeight:600, fontSize:14, fontFamily:font}}>{l.native}</div>
                    <div style={{color:"rgba(255,255,255,0.45)", fontSize:11, marginTop:1}}>{l.label}</div>
                  </div>
                  {l.full ? (
                    <span style={{fontSize:10, fontWeight:700, color:"rgba(80,220,190,0.9)", background:"rgba(48,191,160,0.15)", padding:"3px 8px", borderRadius:20}}>Full</span>
                  ) : (
                    <span style={{fontSize:10, fontWeight:600, color:"rgba(255,255,255,0.4)", background:"rgba(255,255,255,0.06)", padding:"3px 8px", borderRadius:20}}>UI only</span>
                  )}
                </button>
              ))}
            </div>
            <div style={{color:"rgba(255,255,255,0.35)", fontSize:11, marginTop:14, lineHeight:1.5, textAlign:"center"}}>
              "UI only" languages show menus translated, but survival tips appear in Tagalog for now.
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Disaster Card ────────────────────────────────────────────────
function DisasterCard({ d, lang, onClick }) {
  const [hov, setHov] = useState(false);
  const dc = DCOLORS[d.id];
  return (
    <button onClick={onClick}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{
        background: hov ? glass.cardHover : glass.card,
        backdropFilter: "blur(24px) saturate(180%)",
        WebkitBackdropFilter: "blur(24px) saturate(180%)",
        border: `1px solid ${hov ? glass.borderHi : glass.border}`,
        borderRadius:24, padding:"22px 18px", cursor:"pointer",
        textAlign:"left", display:"flex", flexDirection:"column", gap:14,
        transition:"all 0.25s cubic-bezier(.4,0,.2,1)",
        boxShadow: hov ? `0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15)` : `0 2px 12px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.08)`,
        transform: hov ? "scale(1.02)" : "scale(1)",
      }}>
      <div style={{
        width:44, height:44, borderRadius:14,
        background:dc.hd, border:`1px solid ${dc.h}30`,
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:22, backdropFilter:"blur(10px)",
      }}>{d.icon}</div>
      <div>
        <div style={{color:glass.textPrimary, fontWeight:600, fontSize:16, fontFamily:font, marginBottom:5, letterSpacing:-0.2}}>{d.name[lang] || d.name[contentLang(lang)] || d.name.tl}</div>
        <div style={{width:24, height:2, borderRadius:2, background:dc.h, opacity:0.7}}/>
      </div>
    </button>
  );
}

// ─── Pill ─────────────────────────────────────────────────────────
function Pill({ children, color, small }) {
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:4,
      background: color ? color+"22" : glass.pill,
      border: `1px solid ${color ? color+"33" : glass.pillBorder}`,
      color: color || glass.textSecond,
      fontSize: small ? 10 : 11, fontWeight:600, fontFamily:font,
      padding: small ? "2px 7px" : "3px 9px",
      borderRadius:20, letterSpacing:0.3,
      backdropFilter:"blur(10px)",
    }}>{children}</span>
  );
}

// ─── Glass input ──────────────────────────────────────────────────
function GlassInput({ value, onChange, placeholder, onKeyDown, inputRef, style }) {
  return (
    <input ref={inputRef} value={value} onChange={onChange}
      placeholder={placeholder} onKeyDown={onKeyDown}
      style={{
        background: glass.input,
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: `1px solid ${glass.border}`,
        borderRadius:14, padding:"12px 16px",
        color: glass.textPrimary, fontSize:15,
        outline:"none", fontFamily:font,
        width:"100%", boxSizing:"border-box",
        transition:"border-color 0.2s",
        ...style
      }}
      onFocus={e=>e.target.style.borderColor=glass.borderHi}
      onBlur={e=>e.target.style.borderColor=glass.border}
    />
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────
function GlassTabs({ tabs, active, setActive, accent }) {
  return (
    <div style={{
      display:"flex", gap:2,
      background:"rgba(255,255,255,0.06)",
      backdropFilter:"blur(20px)",
      WebkitBackdropFilter:"blur(20px)",
      borderRadius:16, padding:4,
      border:`1px solid ${glass.border}`,
    }}>
      {tabs.map(tb=>(
        <button key={tb.id} onClick={()=>setActive(tb.id)} style={{
          flex:1, padding:"9px 4px", borderRadius:13, border:"none",
          background: active===tb.id ? `rgba(255,255,255,0.16)` : "transparent",
          color: active===tb.id ? glass.white : glass.textSecond,
          fontWeight: active===tb.id ? 600 : 400,
          fontSize:13, cursor:"pointer", fontFamily:font,
          transition:"all 0.2s",
          boxShadow: active===tb.id ? "inset 0 1px 0 rgba(255,255,255,0.15), 0 1px 4px rgba(0,0,0,0.3)" : "none",
          backdropFilter: active===tb.id ? "blur(10px)" : "none",
        }}>{tb.label}</button>
      ))}
    </div>
  );
}

// ─── Disaster Detail ──────────────────────────────────────────────
function DisasterDetail({ d, lang, onBack, t }) {
  const [tab, setTab] = useState("bago");
  const dc = DCOLORS[d.id];
  // English shows English; any PH dialect resolves to its full translation
  // if available, else falls back to Tagalog for safety-critical content.
  const cl = lang === "en" ? "en" : contentLang(lang);
  const dispName = d.name[lang] || d.name[cl] || d.name.tl;
  const tabs = [{id:"levels",label:t.tabAlert},{id:"bago",label:t.tabBefore},{id:"during",label:t.tabDuring},{id:"after",label:t.tabAfter}];
  const content = {levels:d.levels[cl], bago:d.before[cl], during:d.during[cl], after:d.after[cl]};

  return (
    <div style={{padding:"0 0 24px"}}>
      {/* Header */}
      <div style={{padding:"20px 20px 24px"}}>
        <button onClick={onBack} style={{
          display:"flex", alignItems:"center", gap:6,
          background:"rgba(255,255,255,0.08)", backdropFilter:"blur(20px)",
          border:`1px solid ${glass.border}`, borderRadius:12,
          padding:"7px 14px 7px 10px",
          color:glass.textSecond, cursor:"pointer",
          fontFamily:font, fontSize:14, fontWeight:500, marginBottom:24,
        }}>
          {Ico.back}
          <span style={{marginLeft:2}}>{t.backBtn}</span>
        </button>

        <div style={{display:"flex", alignItems:"center", gap:16, marginBottom:24}}>
          <div style={{
            width:60, height:60, borderRadius:18,
            background:dc.hd, border:`1px solid ${dc.h}40`,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:28, backdropFilter:"blur(20px)",
            boxShadow:`0 4px 20px ${dc.h}30`,
          }}>{d.icon}</div>
          <div>
            <div style={{color:glass.white, fontWeight:700, fontSize:26, fontFamily:font, letterSpacing:-0.5}}>{dispName}</div>
            <div style={{width:32, height:2.5, borderRadius:2, background:dc.h, marginTop:7, opacity:0.8}}/>
          </div>
        </div>

        <GlassTabs tabs={tabs} active={tab} setActive={setTab} accent={dc.h}/>
      </div>

      {/* Content */}
      <div style={{padding:"0 20px"}}>
        {tab==="levels" ? (
          <div style={{display:"flex", flexDirection:"column", gap:10}}>
            {content.levels.map((lv,i)=>(
              <div key={i} style={{...glassCard({padding:"14px 16px", borderRadius:16}), borderLeft:`2.5px solid ${dc.h}88`}}>
                <div style={{color:dc.text, fontWeight:600, fontSize:12, marginBottom:5, letterSpacing:0.8, textTransform:"uppercase"}}>{lv.label}</div>
                <div style={{color:glass.textSecond, fontSize:14, lineHeight:1.6}}>{lv.desc}</div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{display:"flex", flexDirection:"column", gap:8}}>
            {content[tab].map((tip,i)=>(
              <div key={i} style={{...glassCard({padding:"13px 14px", borderRadius:16}), display:"flex", gap:12, alignItems:"flex-start"}}>
                <span style={{
                  width:22, height:22, minWidth:22, borderRadius:8,
                  background:dc.hd, border:`1px solid ${dc.h}40`,
                  color:dc.text, display:"flex", alignItems:"center",
                  justifyContent:"center", fontSize:11, fontWeight:700, fontFamily:font,
                  flexShrink:0,
                }}>{i+1}</span>
                <span style={{color:glass.textSecond, fontSize:14, lineHeight:1.6}}>{tip}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Go-Bag ───────────────────────────────────────────────────────
function GoBagScreen({ lang, t }) {
  const cl = lang === "en" ? "en" : contentLang(lang);
  const gobagList = DEFAULT_GOBAG[cl] || DEFAULT_GOBAG.tl;
  const [items, setItems] = useState(gobagList.map((item,i)=>({id:i,item,done:false,custom:false})));
  const [editMode, setEditMode] = useState(false);
  const [newText, setNewText] = useState("");
  const inputRef = useRef(null);
  const done = items.filter(i=>i.done).length;
  const pct = items.length ? (done/items.length)*100 : 0;

  const toggle = i => !editMode && setItems(p=>p.map((x,j)=>j===i?{...x,done:!x.done}:x));
  const remove = i => setItems(p=>p.filter((_,j)=>j!==i));
  const addItem = () => {
    const txt=newText.trim(); if(!txt)return;
    setItems(p=>[...p,{id:Date.now(),item:txt,done:false,custom:true}]);
    setNewText(""); inputRef.current?.focus();
  };

  return (
    <div style={{padding:"20px 20px 0"}}>
      {/* Progress card */}
      <div style={{...glassCard({padding:22, marginBottom:20})}}>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:14}}>
          <div>
            <div style={{color:glass.white, fontWeight:700, fontSize:38, fontFamily:font, letterSpacing:-1, lineHeight:1}}>
              {done}<span style={{fontSize:20, color:glass.textSecond, fontWeight:400, letterSpacing:0}}> / {items.length}</span>
            </div>
            <div style={{color:glass.textSecond, fontSize:13, marginTop:4}}>{t.gobagReady}</div>
          </div>
          {done===items.length&&items.length>0&&(
            <Pill color="#30BFA0">{Ico.check} {t.gobagDone}</Pill>
          )}
        </div>
        {/* Progress track */}
        <div style={{background:"rgba(255,255,255,0.08)", borderRadius:99, height:4, overflow:"hidden"}}>
          <div style={{height:"100%", width:`${pct}%`, borderRadius:99, transition:"width 0.4s cubic-bezier(.4,0,.2,1)",
            background: pct===100
              ? "linear-gradient(90deg,#30BFA0,#40DFC0)"
              : "linear-gradient(90deg,rgba(255,255,255,0.5),rgba(255,255,255,0.8))",
          }}/>
        </div>
      </div>

      {/* Edit toggle */}
      <div style={{display:"flex", justifyContent:"flex-end", marginBottom:12}}>
        <button onClick={()=>setEditMode(e=>!e)} style={{
          display:"flex", alignItems:"center", gap:7,
          background: editMode ? "rgba(48,191,160,0.15)" : glass.card,
          backdropFilter:"blur(20px)",
          border:`1px solid ${editMode ? "rgba(48,191,160,0.3)" : glass.border}`,
          borderRadius:12, padding:"8px 16px",
          color: editMode ? "#30BFA0" : glass.textSecond,
          fontWeight:500, fontSize:13, cursor:"pointer", fontFamily:font,
          transition:"all 0.2s",
        }}>{editMode ? Ico.check : Ico.edit} {editMode?t.gobagDoneEditBtn:t.gobagEditBtn}</button>
      </div>

      {/* Checklist */}
      <div style={{display:"flex", flexDirection:"column", gap:7, marginBottom:14}}>
        {items.map((item,i)=>(
          <div key={item.id} onClick={()=>toggle(i)} style={{
            background: item.done&&!editMode ? "rgba(48,191,160,0.08)" : glass.card,
            backdropFilter:"blur(20px) saturate(180%)",
            WebkitBackdropFilter:"blur(20px) saturate(180%)",
            border:`1px solid ${item.done&&!editMode ? "rgba(48,191,160,0.2)" : glass.border}`,
            borderRadius:16, padding:"13px 14px",
            display:"flex", gap:12, alignItems:"center",
            cursor:editMode?"default":"pointer", transition:"all 0.2s",
            boxShadow:"inset 0 1px 0 rgba(255,255,255,0.06)",
          }}>
            {!editMode&&(
              <div style={{
                width:22, height:22, minWidth:22, borderRadius:7,
                background: item.done ? "rgba(48,191,160,0.25)" : "rgba(255,255,255,0.06)",
                border: `1.5px solid ${item.done ? "rgba(48,191,160,0.5)" : "rgba(255,255,255,0.15)"}`,
                display:"flex", alignItems:"center", justifyContent:"center",
                color:"#30BFA0", flexShrink:0, transition:"all 0.2s",
              }}>{item.done&&Ico.check}</div>
            )}
            <span style={{
              flex:1, color: item.done&&!editMode ? glass.textTertiary : glass.textSecond,
              fontSize:14, lineHeight:1.45, fontFamily:font,
              textDecoration:item.done&&!editMode?"line-through":"none",
              transition:"all 0.2s",
            }}>
              {item.item}
              {item.custom&&<Pill small color="#4A9EFF" style={{marginLeft:8}}>custom</Pill>}
            </span>
            {editMode&&(
              <button onClick={e=>{e.stopPropagation();remove(i)}} style={{
                background:"rgba(224,82,82,0.1)", backdropFilter:"blur(10px)",
                border:"1px solid rgba(224,82,82,0.2)", borderRadius:9,
                color:"rgba(224,82,82,0.8)", cursor:"pointer", padding:"5px 7px",
                display:"flex", alignItems:"center",
              }}>{Ico.trash}</button>
            )}
          </div>
        ))}
      </div>

      {/* Add input */}
      <div style={{display:"flex", gap:8, marginBottom:20}}>
        <GlassInput inputRef={inputRef} value={newText}
          onChange={e=>setNewText(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&addItem()}
          placeholder={t.gobagAddPlaceholder}
          style={{flex:1, borderRadius:14}}/>
        <button onClick={addItem} style={{
          background:"rgba(255,255,255,0.13)",
          backdropFilter:"blur(20px)",
          border:`1px solid ${glass.borderHi}`,
          borderRadius:14, padding:"12px 18px",
          color:glass.white, cursor:"pointer",
          display:"flex", alignItems:"center",
          boxShadow:"inset 0 1px 0 rgba(255,255,255,0.2)",
          transition:"all 0.2s",
        }}>{Ico.plus}</button>
      </div>
    </div>
  );
}

// ─── Hotlines ─────────────────────────────────────────────────────
function HotlinesScreen({ lang, t }) {
  const [pressed, setPressed] = useState(null);
  const cl = lang === "en" ? "en" : contentLang(lang);

  const call = (h) => {
    window.location.href = `tel:${h.dial}`;
  };

  return (
    <div style={{padding:"20px 20px 0"}}>
      <div style={{...glassCard({padding:"13px 16px", marginBottom:20, borderRadius:16}),
        background:"rgba(224,82,82,0.1)", border:"1px solid rgba(224,82,82,0.2)"}}>
        <span style={{color:"rgba(255,130,130,0.9)", fontSize:13, lineHeight:1.5}} dangerouslySetInnerHTML={{__html:t.hotlineWarning}}/>
      </div>

      <div style={{display:"flex", flexDirection:"column", gap:8, marginBottom:20}}>
        {HOTLINES.map((h,i)=>(
          <a key={i} href={`tel:${h.dial}`}
            style={{textDecoration:"none", display:"block"}}
            onMouseDown={()=>setPressed(i)} onMouseUp={()=>setPressed(null)}
            onTouchStart={()=>setPressed(i)} onTouchEnd={()=>setPressed(null)}>
            <div style={{
              ...glassCard({padding:"15px 18px", borderRadius:18}),
              display:"flex", justifyContent:"space-between", alignItems:"center",
              background: pressed===i ? "rgba(255,255,255,0.14)" : glass.card,
              transform: pressed===i ? "scale(0.98)" : "scale(1)",
              transition:"all 0.15s cubic-bezier(.4,0,.2,1)",
              cursor:"pointer",
            }}>
              <div style={{flex:1}}>
                <div style={{color:glass.textPrimary, fontWeight:600, fontSize:15, fontFamily:font}}>{h.name}</div>
                <div style={{color:glass.textSecond, fontSize:12, marginTop:2}}>{h.desc[lang] || h.desc[cl] || h.desc.tl}</div>
              </div>
              {/* Number pill + phone icon */}
              <div style={{display:"flex", alignItems:"center", gap:10}}>
                <div style={{
                  background:"rgba(255,255,255,0.10)", backdropFilter:"blur(20px)",
                  border:`1px solid ${glass.borderHi}`,
                  borderRadius:12, padding:"8px 14px",
                  color:glass.white, fontWeight:600, fontSize:13, fontFamily:font,
                  letterSpacing:0.3,
                  boxShadow:"inset 0 1px 0 rgba(255,255,255,0.18)",
                }}>{h.number}</div>
                <div style={{
                  width:34, height:34, borderRadius:10,
                  background:"rgba(48,191,160,0.18)",
                  border:"1px solid rgba(48,191,160,0.3)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  color:"rgba(80,220,190,0.9)", flexShrink:0,
                }}>{Ico.phone}</div>
              </div>
            </div>
          </a>
        ))}
      </div>

      <div style={{...glassCard({padding:18, borderRadius:18, marginBottom:20})}}>
        <div style={{color:"rgba(255,200,80,0.9)", fontWeight:600, fontSize:14, fontFamily:font, marginBottom:8}}>{t.meetingTitle}</div>
        <div style={{color:glass.textSecond, fontSize:13, lineHeight:1.65}}>{t.meetingDesc}</div>
      </div>
    </div>
  );
}

// ─── Leaflet loader (CDN, loaded once) ──────────────────────────
// We load Leaflet's JS + CSS from a CDN at runtime since this gives us
// real OpenStreetMap tiles — accurate coastlines, city/region labels,
// and native pinch-to-zoom/pan — matching a real Google-Maps-like feel.
// This requires internet only while the map screen is open; every other
// screen in the app remains fully offline.
let _leafletLoadPromise = null;
function loadLeaflet() {
  if (window.L) return Promise.resolve(window.L);
  if (_leafletLoadPromise) return _leafletLoadPromise;
  _leafletLoadPromise = new Promise((resolve, reject) => {
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(css);
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.async = true;
    script.onload = () => resolve(window.L);
    script.onerror = reject;
    document.head.appendChild(script);
  });
  return _leafletLoadPromise;
}

// Dark-themed tile layer (CartoDB Dark Matter — free, no API key) so the
// map matches the app's visual language while still being real map data.
const TILE_URL = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const TILE_ATTR = '© OpenStreetMap, © CARTO';

// ─── Mini Map Preview (collapsed, tappable to expand) ────────────
function MiniMapPreview({ centers, onExpand }) {
  const mapRef = useRef(null);
  const containerRef = useRef(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let map;
    loadLeaflet().then(L => {
      if (!containerRef.current || mapRef.current) return;
      map = L.map(containerRef.current, {
        center: [12.5, 122],
        zoom: 5,
        zoomControl: false,
        attributionControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        touchZoom: false,
        boxZoom: false,
        keyboard: false,
      });
      L.tileLayer(TILE_URL, { maxZoom: 18, subdomains:"abcd" }).addTo(map);
      centers.forEach(c => {
        if (!c.lat || !c.lng) return;
        L.circleMarker([c.lat, c.lng], {
          radius: 4, color:"#0B0E14", weight:1,
          fillColor:"#4A9EFF", fillOpacity:0.95,
        }).addTo(map);
      });
      mapRef.current = map;
      setLoaded(true);
    }).catch(()=>{});
    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
  }, []);

  return (
    <button onClick={onExpand} style={{
      width:"100%", border:`1px solid ${glass.border}`, padding:0, cursor:"pointer",
      borderRadius:20, overflow:"hidden", position:"relative",
      background:"#0F1B2E", WebkitTapHighlightColor:"transparent",
      appearance:"none", margin:0, display:"block",
    }}>
      <div style={{position:"relative", borderRadius:20, overflow:"hidden", background:"#0F1B2E", height:180}}>
        <div ref={containerRef} style={{width:"100%", height:"100%", pointerEvents:"none"}}/>
        {!loaded && (
          <div style={{position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", color:"rgba(255,255,255,0.4)", fontSize:12, fontFamily:font}}>
            Loading map…
          </div>
        )}
        {/* Overlay gradient + label */}
        <div style={{
          position:"absolute", inset:0,
          background:"linear-gradient(180deg, transparent 40%, rgba(5,8,14,0.88) 100%)",
          display:"flex", flexDirection:"column", justifyContent:"flex-end",
          padding:"12px 16px", pointerEvents:"none",
        }}>
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
            <div>
              <div style={{color:"#FFFFFF", fontWeight:600, fontSize:13, fontFamily:font}}>{centers.length} centers mapped</div>
              <div style={{color:"rgba(255,255,255,0.7)", fontSize:11, marginTop:1}}>Tap to explore full map</div>
            </div>
            <div style={{
              width:32, height:32, borderRadius:10,
              background:"rgba(255,255,255,0.18)",
              border:`1px solid rgba(255,255,255,0.28)`,
              display:"flex", alignItems:"center", justifyContent:"center",
              color:"#FFFFFF",
            }}>{Ico.expand}</div>
          </div>
        </div>
      </div>
    </button>
  );
}

// ─── Full Interactive Map Modal (real pan/zoom via Leaflet) ─────
function FullMapModal({ centers, onClose, t }) {
  const [selected, setSelected] = useState(null);
  const mapRef = useRef(null);
  const containerRef = useRef(null);
  const markersRef = useRef([]);
  const [loaded, setLoaded] = useState(false);

  const openInGoogleMaps = (c) => {
    const url = c.lat && c.lng
      ? `https://www.google.com/maps/search/?api=1&query=${c.lat},${c.lng}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.name+' '+c.address+' Philippines')}`;
    window.open(url, "_blank");
  };

  useEffect(() => {
    let map;
    loadLeaflet().then(L => {
      if (!containerRef.current || mapRef.current) return;
      map = L.map(containerRef.current, {
        center: [12.5, 122],
        zoom: 6,
        zoomControl: true,
        attributionControl: true,
        minZoom: 5,
        maxZoom: 13, // region/city level — not street/barangay level
      });
      L.tileLayer(TILE_URL, { maxZoom: 18, subdomains:"abcd", attribution: TILE_ATTR }).addTo(map);

      centers.forEach((c,i) => {
        if (!c.lat || !c.lng) return;
        const marker = L.circleMarker([c.lat, c.lng], {
          radius: 6, color:"#0B0E14", weight:1.5,
          fillColor:"#4A9EFF", fillOpacity:0.95,
        }).addTo(map);
        marker.on("click", () => setSelected(i));
        markersRef.current[i] = marker;
      });

      mapRef.current = map;
      setLoaded(true);
    }).catch(()=>{});
    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
      markersRef.current = [];
    };
  }, []);

  // Highlight selected marker + fly to it
  useEffect(() => {
    if (!mapRef.current || selected===null) return;
    const c = centers[selected];
    if (!c || !c.lat) return;
    mapRef.current.flyTo([c.lat, c.lng], Math.max(mapRef.current.getZoom(), 10), { duration: 0.5 });
    markersRef.current.forEach((m,i) => {
      if (!m) return;
      m.setStyle(i===selected ? {fillColor:"#F39C12", radius:9} : {fillColor:"#4A9EFF", radius:6});
    });
  }, [selected]);

  return (
    <div style={{
      position:"fixed", top:0, left:0, right:0, bottom:0, zIndex:999,
      background:"#080C12",
      display:"flex", flexDirection:"column",
      maxWidth:430, margin:"0 auto",
      WebkitOverflowScrolling:"touch",
    }}>
      {/* Header */}
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", padding:"18px 20px 14px", flexShrink:0, background:"#080C12"}}>
        <div>
          <div style={{color:"#FFFFFF", fontWeight:700, fontSize:18, fontFamily:font}}>Safe Zones Map</div>
          <div style={{color:"rgba(255,255,255,0.6)", fontSize:12, marginTop:2}}>{centers.length} evacuation centers</div>
        </div>
        <button onClick={onClose} style={{
          width:36, height:36, borderRadius:11,
          background:"#1A2433",
          border:`1px solid rgba(255,255,255,0.15)`,
          color:"#FFFFFF", cursor:"pointer",
          display:"flex", alignItems:"center", justifyContent:"center",
          appearance:"none", padding:0, flexShrink:0,
        }}>{Ico.close}</button>
      </div>

      {/* Real interactive map — pinch/scroll to zoom, drag to pan, region/city level only */}
      <div style={{flex:"0 0 auto", padding:"0 20px 14px", background:"#080C12"}}>
        <div style={{
          position:"relative", borderRadius:20, overflow:"hidden",
          border:`1px solid rgba(255,255,255,0.12)`,
          background:"#0F1B2E", height:"42vh",
        }}>
          <div ref={containerRef} style={{width:"100%", height:"100%"}}/>
          {!loaded && (
            <div style={{position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", color:"rgba(255,255,255,0.4)", fontSize:13, fontFamily:font}}>
              Loading map…
            </div>
          )}
        </div>
        <div style={{color:"rgba(255,255,255,0.35)", fontSize:11, marginTop:6, textAlign:"center"}}>Pinch or scroll to zoom · drag to pan</div>
      </div>

      {/* Selected center detail card */}
      {selected!==null && centers[selected] && (
        <div style={{padding:"0 20px 14px", flexShrink:0, background:"#080C12"}}>
          <div style={{
            background:"#141E2A", border:"1px solid rgba(243,156,18,0.4)",
            borderRadius:16, padding:"14px 16px",
          }}>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:10}}>
              <div style={{flex:1}}>
                <div style={{color:"#F0F4F8", fontWeight:600, fontSize:14, fontFamily:font, marginBottom:4}}>{centers[selected].name}</div>
                <div style={{color:"rgba(255,255,255,0.6)", fontSize:12, display:"flex", gap:5, alignItems:"center"}}>{Ico.pin}{centers[selected].address}</div>
                <div style={{display:"flex", gap:6, marginTop:8, flexWrap:"wrap"}}>
                  <Pill small>{centers[selected].type}</Pill>
                  <Pill small color="rgba(48,191,160,0.8)">👥 {centers[selected].capacity}</Pill>
                </div>
              </div>
              <button onClick={()=>openInGoogleMaps(centers[selected])} style={{
                background:"rgba(74,158,255,0.22)", border:"1px solid rgba(74,158,255,0.4)",
                borderRadius:11, padding:"8px 12px", color:"#9CCBFF",
                fontWeight:600, fontSize:11, cursor:"pointer", fontFamily:font,
                display:"flex", alignItems:"center", gap:5, flexShrink:0, whiteSpace:"nowrap",
                appearance:"none",
              }}>{Ico.maps} Open</button>
            </div>
          </div>
        </div>
      )}

      {/* Scrollable list below map */}
      <div style={{flex:1, overflowY:"auto", padding:"4px 20px 30px", background:"#080C12", WebkitOverflowScrolling:"touch"}}>
        <div style={{color:"rgba(255,255,255,0.4)", fontSize:10, fontWeight:600, letterSpacing:1.5, marginBottom:10, textTransform:"uppercase"}}>All Centers</div>
        <div style={{display:"flex", flexDirection:"column", gap:7}}>
          {centers.map((c,i)=>(
            <div key={i} onClick={()=>setSelected(i)} role="button" tabIndex={0} style={{
              textAlign:"left", cursor:"pointer", width:"100%", boxSizing:"border-box",
              border: selected===i ? "1px solid rgba(243,156,18,0.45)" : "1px solid rgba(255,255,255,0.10)",
              background: selected===i ? "#2A2010" : "#141E2A",
              borderRadius:14, padding:"11px 14px",
              display:"flex", alignItems:"center", gap:10,
            }}>
              <span style={{width:6,height:6,minWidth:6,borderRadius:99,background:selected===i?"#F39C12":"#4A9EFF",flexShrink:0}}/>
              <div style={{flex:1, minWidth:0}}>
                <div style={{color:"#F0F4F8", fontSize:13, fontWeight:500, fontFamily:font, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>{c.name}</div>
                <div style={{color:"rgba(255,255,255,0.4)", fontSize:11, marginTop:1}}>{c.city}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Evac Screen ──────────────────────────────────────────────────
function EvacScreen({ lang, t }) {
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState("All");
  const [myCenters, setMyCenters] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [nc, setNc] = useState({name:"",address:"",notes:""});
  const [showMap, setShowMap] = useState(false);

  const filtered = EVAC_DB.filter(e=>{
    const mr = region==="All" || e.region===region;
    const q = search.toLowerCase();
    return mr && (!q || [e.city,e.name,e.address,e.region].some(s=>s.toLowerCase().includes(q)));
  });

  const grouped = {};
  filtered.forEach(e=>{ if(!grouped[e.city])grouped[e.city]=[]; grouped[e.city].push(e); });

  const save = () => {
    if (!nc.name.trim()) return;
    setMyCenters(p=>[...p,{...nc,id:Date.now()}]);
    setNc({name:"",address:"",notes:""}); setShowAdd(false);
  };

  return (
    <div style={{padding:"20px 20px 0"}}>
      {/* Interactive map preview — tap to expand */}
      <div style={{marginBottom:16}}>
        <MiniMapPreview centers={filtered} onExpand={()=>setShowMap(true)}/>
      </div>

      {showMap && <FullMapModal centers={filtered} onClose={()=>setShowMap(false)} t={t}/>}

      {/* Info */}
      <div style={{...glassCard({padding:"13px 16px", marginBottom:16, borderRadius:16}),
        background:"rgba(48,191,160,0.08)", border:"1px solid rgba(48,191,160,0.15)"}}>
        <div style={{color:"rgba(80,220,190,0.9)", fontWeight:600, fontSize:13, marginBottom:4}}>{t.evacHowTitle}</div>
        <div style={{color:glass.textSecond, fontSize:13, lineHeight:1.5}}>{t.evacHowBody}</div>
      </div>

      {/* Search */}
      <div style={{position:"relative", marginBottom:12}}>
        <span style={{position:"absolute",left:13,top:"50%",transform:"translateY(-50%)",color:glass.textSecond, pointerEvents:"none"}}>{Ico.search}</span>
        <GlassInput value={search} onChange={e=>setSearch(e.target.value)}
          placeholder={t.evacSearchPlaceholder} style={{paddingLeft:38}}/>
      </div>

      {/* Region chips */}
      <div style={{display:"flex", gap:6, overflowX:"auto", marginBottom:20, paddingBottom:4}}>
        {REGIONS.map(r=>(
          <button key={r} onClick={()=>setRegion(r)} style={{
            whiteSpace:"nowrap",
            background: region===r ? "rgba(255,255,255,0.18)" : glass.card,
            backdropFilter:"blur(20px)",
            border:`1px solid ${region===r ? glass.borderHi : glass.border}`,
            borderRadius:20, padding:"6px 14px",
            color: region===r ? glass.white : glass.textSecond,
            fontWeight: region===r ? 600 : 400,
            fontSize:12, cursor:"pointer", flexShrink:0, fontFamily:font,
            transition:"all 0.18s",
            boxShadow: region===r ? "inset 0 1px 0 rgba(255,255,255,0.2)" : "none",
          }}>{r}</button>
        ))}
      </div>

      {/* My Centers */}
      <div style={{marginBottom:20}}>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12}}>
          <div style={{color:glass.textPrimary, fontWeight:600, fontSize:15, fontFamily:font}}>{t.evacMyTitle}</div>
          <button onClick={()=>setShowAdd(s=>!s)} style={{
            display:"flex", alignItems:"center", gap:7,
            background:"rgba(255,255,255,0.13)", backdropFilter:"blur(20px)",
            border:`1px solid ${glass.borderHi}`, borderRadius:12,
            padding:"7px 14px",
            color:glass.white, fontWeight:500, fontSize:12, cursor:"pointer", fontFamily:font,
            boxShadow:"inset 0 1px 0 rgba(255,255,255,0.15)",
          }}>{Ico.plus} {t.evacMyAddBtn}</button>
        </div>

        {showAdd&&(
          <div style={{...glassCard({padding:16, marginBottom:12, borderRadius:18}), border:"1px solid rgba(48,191,160,0.25)"}}>
            <div style={{display:"flex", flexDirection:"column", gap:8, marginBottom:12}}>
              {[{k:"name",ph:t.evacMyNamePlaceholder},{k:"address",ph:t.evacMyAddressPlaceholder},{k:"notes",ph:t.evacMyNotesPlaceholder}].map(f=>(
                <GlassInput key={f.k} value={nc[f.k]} onChange={e=>setNc(p=>({...p,[f.k]:e.target.value}))} placeholder={f.ph}/>
              ))}
            </div>
            <div style={{display:"flex", gap:8}}>
              <button onClick={save} style={{flex:1, background:"rgba(48,191,160,0.20)", backdropFilter:"blur(20px)", border:"1px solid rgba(48,191,160,0.3)", borderRadius:12, padding:"10px", color:"rgba(80,220,190,0.95)", fontWeight:600, fontSize:13, cursor:"pointer", fontFamily:font}}>{t.evacSaveBtn}</button>
              <button onClick={()=>setShowAdd(false)} style={{flex:1, background:glass.card, backdropFilter:"blur(20px)", border:`1px solid ${glass.border}`, borderRadius:12, padding:"10px", color:glass.textSecond, fontWeight:500, fontSize:13, cursor:"pointer", fontFamily:font}}>{t.evacCancelBtn}</button>
            </div>
          </div>
        )}

        {myCenters.length===0 ? (
          <div style={{...glassCard({padding:"18px", borderRadius:16, textAlign:"center"}), color:glass.textTertiary, fontSize:13}}>{t.evacMyEmpty}</div>
        ) : myCenters.map(c=>{
          const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((c.address||c.name)+' Philippines')}`;
          return (
            <div key={c.id} style={{...glassCard({padding:"14px 16px", marginBottom:8, borderRadius:18}), border:"1px solid rgba(255,200,80,0.2)"}}>
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start"}}>
                <div style={{flex:1}}>
                  <div style={{color:glass.textPrimary, fontWeight:600, fontSize:14, fontFamily:font}}>{c.name}</div>
                  {c.address&&(
                    <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
                      style={{textDecoration:"none", display:"flex", gap:5, alignItems:"center", marginTop:4}}>
                      <span style={{color:"rgba(100,180,255,0.8)", fontSize:12}}>{Ico.pin}</span>
                      <span style={{color:"rgba(100,180,255,0.8)", fontSize:12, textDecoration:"underline", textDecorationColor:"rgba(100,180,255,0.3)"}}>{c.address}</span>
                    </a>
                  )}
                  {c.notes&&<div style={{color:glass.textTertiary, fontSize:12, marginTop:3, fontStyle:"italic"}}>{c.notes}</div>}
                  <div style={{marginTop:7, display:"flex", gap:6, alignItems:"center"}}>
                    <Pill color="rgba(255,200,80,0.9)">{t.evacUserLabel}</Pill>
                    {c.address&&(
                      <a href={mapsUrl} target="_blank" rel="noopener noreferrer" style={{textDecoration:"none"}}>
                        <div style={{display:"flex", alignItems:"center", gap:4, background:"rgba(74,158,255,0.12)", border:"1px solid rgba(74,158,255,0.22)", borderRadius:20, padding:"3px 9px", color:"rgba(100,180,255,0.85)", fontSize:11, fontWeight:600}}>
                          {Ico.maps} <span>Maps</span>
                        </div>
                      </a>
                    )}
                  </div>
                </div>
                <button onClick={()=>setMyCenters(p=>p.filter(x=>x.id!==c.id))} style={{background:"transparent", border:"none", color:glass.textTertiary, cursor:"pointer", padding:4, display:"flex"}}>{Ico.trash}</button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Divider */}
      <div style={{display:"flex", alignItems:"center", gap:10, marginBottom:16}}>
        <div style={{flex:1, height:1, background:glass.border}}/>
        <span style={{color:glass.textTertiary, fontSize:10, fontWeight:600, letterSpacing:1.5}}>{filtered.length} CENTERS</span>
        <div style={{flex:1, height:1, background:glass.border}}/>
      </div>

      {/* Gov't DB */}
      {Object.entries(grouped).map(([city,centers])=>(
        <div key={city} style={{marginBottom:16}}>
          <div style={{color:glass.textSecond, fontWeight:600, fontSize:11, marginBottom:8, letterSpacing:1.2, textTransform:"uppercase"}}>{city}</div>
          <div style={{display:"flex", flexDirection:"column", gap:7}}>
            {centers.map((c,i)=>{
              const mapsUrl = c.lat && c.lng
                ? `https://www.google.com/maps/search/?api=1&query=${c.lat},${c.lng}`
                : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.name+' '+c.address+' Philippines')}`;
              return (
                <a key={i} href={mapsUrl} target="_blank" rel="noopener noreferrer"
                  style={{textDecoration:"none", display:"block"}}>
                  <div style={{
                    ...glassCard({padding:"14px 16px", borderRadius:16}),
                    cursor:"pointer", transition:"all 0.18s cubic-bezier(.4,0,.2,1)",
                  }}
                    onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,0.13)"; e.currentTarget.style.transform="scale(1.01)";}}
                    onMouseLeave={e=>{e.currentTarget.style.background=glass.card; e.currentTarget.style.transform="scale(1)";}}
                    onTouchStart={e=>{e.currentTarget.style.background="rgba(255,255,255,0.16)"; e.currentTarget.style.transform="scale(0.98)";}}
                    onTouchEnd={e=>{e.currentTarget.style.background=glass.card; e.currentTarget.style.transform="scale(1)";}}
                  >
                    <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:10}}>
                      <div style={{flex:1}}>
                        <div style={{color:glass.textPrimary, fontWeight:500, fontSize:14, fontFamily:font, marginBottom:5}}>{c.name}</div>
                        <div style={{color:glass.textSecond, fontSize:12, display:"flex", gap:5, alignItems:"center", marginBottom:7}}>{Ico.pin}{c.address}</div>
                        <div style={{display:"flex", gap:6, flexWrap:"wrap"}}>
                          <Pill>{c.type}</Pill>
                          <Pill color="rgba(48,191,160,0.8)">👥 {c.capacity}</Pill>
                          <Pill color="rgba(48,191,160,0.8)">{t.evacGovLabel}</Pill>
                        </div>
                      </div>
                      {/* Maps button */}
                      <div style={{
                        width:36, height:36, minWidth:36, borderRadius:11,
                        background:"rgba(74,158,255,0.15)",
                        border:"1px solid rgba(74,158,255,0.25)",
                        display:"flex", alignItems:"center", justifyContent:"center",
                        color:"rgba(100,180,255,0.9)", flexShrink:0, marginTop:2,
                      }}>{Ico.maps}</div>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      ))}

      {Object.keys(grouped).length===0&&(
        <div style={{...glassCard({padding:24, borderRadius:16, textAlign:"center"}), color:glass.textTertiary, fontSize:13}}>No results found.</div>
      )}

      <div style={{...glassCard({padding:14, borderRadius:16, marginTop:8, textAlign:"center"}), color:glass.textTertiary, fontSize:12, lineHeight:1.6, marginBottom:20}}>
        {t.evacDisclaimer}
      </div>
    </div>
  );
}

// ─── Home Screen ──────────────────────────────────────────────────
function HomeScreen({ lang, t, onSelect }) {
  return (
    <div style={{padding:"20px 20px 0"}}>
      {/* Logo */}
      <div style={{display:"flex", alignItems:"center", gap:13, marginBottom:16}}>
        <div style={{
          width:44, height:44, borderRadius:14,
          background:"rgba(255,255,255,0.10)", backdropFilter:"blur(20px)",
          border:`1px solid ${glass.border}`,
          display:"flex", alignItems:"center", justifyContent:"center",
          color:"rgba(255,255,255,0.85)",
          boxShadow:"inset 0 1px 0 rgba(255,255,255,0.2)",
        }}>{Ico.shield}</div>
        <div>
          <div style={{color:glass.white, fontWeight:700, fontSize:22, fontFamily:font, letterSpacing:-0.5}}>
            Ligtas <span style={{color:"rgba(255,255,255,0.45)"}}>PH</span>
          </div>
          <div style={{color:glass.textTertiary, fontSize:11, letterSpacing:0.3, marginTop:1}}>{t.appTagline}</div>
        </div>
      </div>

      {/* Banner */}
      <div style={{...glassCard({padding:"13px 16px", marginBottom:22, borderRadius:16})}}>
        <span style={{color:glass.textSecond, fontSize:13, lineHeight:1.5}}>{t.heroBanner}</span>
      </div>

      {/* Section label */}
      <div style={{color:glass.textTertiary, fontSize:11, fontWeight:600, letterSpacing:1.5, textTransform:"uppercase", marginBottom:13}}>{t.sectionLabel}</div>

      {/* Grid */}
      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:11, marginBottom:20}}>
        {DISASTERS.map(d=><DisasterCard key={d.id} d={d} lang={lang} onClick={()=>onSelect(d)}/>)}
      </div>

      {/* Daily tip */}
      <div style={{...glassCard({padding:18, marginBottom:20, borderRadius:20}), borderColor:"rgba(48,191,160,0.2)"}}>
        <div style={{color:"rgba(80,220,190,0.9)", fontWeight:600, fontSize:13, fontFamily:font, marginBottom:6}}>{t.dailyTipTitle}</div>
        <div style={{color:glass.textSecond, fontSize:13, lineHeight:1.65}} dangerouslySetInnerHTML={{__html:t.dailyTip}}/>
      </div>
    </div>
  );
}

// ─── Nav Bar ──────────────────────────────────────────────────────
function NavBar({ active, setActive, t }) {
  const items = [
    {id:"home",  icon:Ico.navHome,  label:t.navHome},
    {id:"gobag", icon:Ico.navBag,   label:t.navGobag},
    {id:"hotlines",icon:Ico.navPhone,label:t.navHotlines},
    {id:"evac",  icon:Ico.navEvac,  label:t.navEvac},
  ];
  return (
    <div style={{
      position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)",
      width:"100%", maxWidth:430,
      background: glass.nav,
      backdropFilter:"blur(40px) saturate(180%)",
      WebkitBackdropFilter:"blur(40px) saturate(180%)",
      borderTop:`1px solid ${glass.border}`,
      display:"flex", padding:"10px 10px 20px", gap:3, zIndex:100,
    }}>
      {items.map(n=>(
        <button key={n.id} onClick={()=>setActive(n.id)} style={{
          flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:5,
          background: active===n.id ? "rgba(255,255,255,0.12)" : "transparent",
          backdropFilter: active===n.id ? "blur(20px)" : "none",
          border: active===n.id ? `1px solid ${glass.border}` : "1px solid transparent",
          borderRadius:14, padding:"8px 4px",
          cursor:"pointer", transition:"all 0.2s",
          color: active===n.id ? glass.white : glass.textSecond,
          boxShadow: active===n.id ? "inset 0 1px 0 rgba(255,255,255,0.15)" : "none",
        }}>
          {n.icon}
          <span style={{fontSize:10, fontWeight:500, letterSpacing:0.2, fontFamily:font}}>{n.label}</span>
        </button>
      ))}
    </div>
  );
}

// ─── Mesh Background ──────────────────────────────────────────────
// Signature element: each screen has its own deep colour mesh
function MeshBg({ screenId }) {
  const m = MESH[screenId] || MESH.home;
  return (
    <div style={{
      position:"fixed", inset:0, zIndex:0, pointerEvents:"none",
      background:`radial-gradient(ellipse 120% 60% at 30% 10%, ${m[1]} 0%, transparent 70%),
                  radial-gradient(ellipse 80% 80% at 80% 80%, ${m[2]} 0%, transparent 70%),
                  ${m[0]}`,
    }}/>
  );
}

// ─── App Root ─────────────────────────────────────────────────────
export default function LigtasPH() {
  const [lang, setLang] = useState("en");
  const [screen, setScreen] = useState("home");
  const [selected, setSelected] = useState(null);
  // T only has full UI translations for en + the 10 "full" PH languages.
  // Any other PH dialect (UI-only tier) falls back to Tagalog UI strings.
  const t = T[lang] || T[contentLang(lang)] || T.tl;

  const switchLang = l => { setLang(l); setScreen("home"); setSelected(null); };
  const selectDisaster = d => { setSelected(d); setScreen("disaster"); };
  const nav = s => { setScreen(s); setSelected(null); };

  const meshKey = screen==="disaster" && selected ? selected.id : screen;

  return (
    <div style={{
      minHeight:"100vh", maxWidth:430, margin:"0 auto",
      display:"flex", flexDirection:"column",
      fontFamily:font, color:glass.white,
      position:"relative", overflow:"hidden",
    }}>
      <MeshBg screenId={meshKey}/>

      {/* Content layer above mesh */}
      <div style={{position:"relative", zIndex:1, display:"flex", flexDirection:"column", minHeight:"100vh"}}>
        {/* Top bar */}
        <div style={{
          padding:"14px 20px 0",
          display:"flex", justifyContent:"space-between", alignItems:"center",
          flexShrink:0,
        }}>
          <span style={{fontSize:10, color:glass.textTertiary, fontWeight:600, letterSpacing:2, textTransform:"uppercase"}}>Ligtas PH</span>
          <LangToggle lang={lang} setLang={switchLang}/>
        </div>

        {/* Scrollable */}
        <div style={{flex:1, overflowY:"auto", paddingBottom:80}}>
          {screen==="home"     && <HomeScreen lang={lang} t={t} onSelect={selectDisaster}/>}
          {screen==="disaster" && selected && <DisasterDetail d={selected} lang={lang} t={t} onBack={()=>nav("home")}/>}
          {screen==="gobag"    && <GoBagScreen lang={lang} t={t}/>}
          {screen==="hotlines" && <HotlinesScreen lang={lang} t={t}/>}
          {screen==="evac"     && <EvacScreen lang={lang} t={t}/>}
        </div>

        <NavBar active={screen==="disaster"?"home":screen} setActive={nav} t={t}/>
      </div>
    </div>
  );
}