import { useState, useRef } from "react";

// ─────────────────────────────────────────────────────────────────
// DESIGN DIRECTION
// Apple visionOS / iOS 18 aesthetic: deep space blur backgrounds,
// frosted-glass cards with rgba white layering, SF Pro-style type,
// vibrancy-aware text, liquid spring transitions.
// Signature element: the entire UI floats on a living gradient
// mesh that shifts hue per disaster — like the Lock Screen wallpaper.
// ─────────────────────────────────────────────────────────────────

const font = "-apple-system, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', sans-serif";

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
  },
};

// ─── Data ─────────────────────────────────────────────────────────
const DISASTERS = [
  { id:"bagyo", icon:"🌀", name:{en:"Typhoon",tl:"Bagyo"},
    levels:{en:[{label:"Signal 1",desc:"Caution. Possible brownouts. Charge devices now."},{label:"Signal 2",desc:"Prepare go-bag. Locate nearest evacuation center."},{label:"Signal 3",desc:"Stay indoors. Exit only for emergencies."},{label:"Signal 4",desc:"Very dangerous. Follow all LGU and NDRRMC orders."},{label:"Signal 5",desc:"Catastrophic. Evacuate immediately."}],
             tl:[{label:"Signal 1",desc:"Maingat na pansin. Maaaring mag-brownout. I-charge ang mga device."},{label:"Signal 2",desc:"Ihanda ang go-bag. Alamin ang pinakamalapit na evacuation center."},{label:"Signal 3",desc:"Manatili sa bahay. Lumabas lamang kung emergency."},{label:"Signal 4",desc:"Lubhang mapanganib. Sundin ang lahat ng utos ng LGU at NDRRMC."},{label:"Signal 5",desc:"Katastropiko. Mag-evacuate agad."}]},
    before:{en:["Charge all gadgets and power banks","Store water — 3-day supply per person","Prepare go-bag: ID, documents, medicine, food","Trim tree branches near your home","Know your barangay evacuation route"],tl:["I-charge ang lahat ng gadget at power banks","Mag-imbak ng tubig — 3 araw na supply per tao","Ihanda ang go-bag: ID, dokumento, gamot, pagkain","Putulin ang mga sanga ng puno malapit sa bahay","Alamin ang evacuation route ng inyong barangay"]},
    during:{en:["Stay in the sturdiest room, away from windows","Don't go out during the eye — the calm is deceptive","Never cross floodwater — 6 inches can knock you down","Monitor PAGASA on radio — no internet needed","Storm surge warning? Evacuate to high ground immediately"],tl:["Manatili sa pinaka-matibay na silid, malayo sa bintana","Huwag lumabas habang nasa mata ng bagyo","Huwag tumawid sa baha — 6 pulgada lang ang sapat para matumba","I-monitor ang PAGASA sa radyo","Storm surge warning? Mag-evacuate agad"]},
    after:{en:["Wait for all-clear before going outside","Watch for live wires in floodwater","Report injuries to the barangay health center","Get relief goods at DSWD distribution points","Document damage for assistance claims"],tl:["Hintayin ang all-clear bago lumabas","Mag-ingat sa live wires sa baha","Iulat ang mga nasugatan sa barangay health center","Kumuha ng relief goods sa DSWD","I-document ang pinsala para sa assistance"]}},

  { id:"lindol", icon:"🌍", name:{en:"Earthquake",tl:"Lindol"},
    levels:{en:[{label:"I–II",desc:"Barely felt. No action needed."},{label:"III–IV",desc:"Felt by most. Objects may rattle."},{label:"V–VI",desc:"Significant shaking. Watch for falling objects."},{label:"VII–VIII",desc:"Major damage. Evacuate buildings."},{label:"IX–X",desc:"Extreme destruction. Possible tsunami — move from coast."}],
             tl:[{label:"I–II",desc:"Halos hindi nararamdaman. Walang aksyon."},{label:"III–IV",desc:"Nararamdaman ng karamihan. Maaaring tumalon ang mga bagay."},{label:"V–VI",desc:"Makabuluhang pag-alog. Mag-ingat sa pagbagsak."},{label:"VII–VIII",desc:"Malaking pinsala. Mag-evacuate mula sa mga gusali."},{label:"IX–X",desc:"Matinding pagkasira. Posibleng tsunami — lumayo sa dalampasigan."}]},
    before:{en:["Know fault lines near your area (PHIVOLCS)","Secure heavy furniture to walls","Learn Drop, Cover, Hold On","Identify safe spots in every room","Keep emergency kit within easy reach"],tl:["Alamin ang fault lines malapit sa inyong lugar","I-secure ang mga mabibigat na kasangkapan sa dingding","Alamin ang Drop, Cover, Hold On","Tandaan ang ligtas na lugar sa bawat silid","Mag-imbak ng emergency kit sa madaling maabot"]},
    during:{en:["DROP, COVER your head and neck, HOLD ON","Don't run outside — falling debris is the real danger","Stay away from windows and heavy furniture","Outdoors: move away from buildings and poles","Driving: pull over away from bridges"],tl:["DROP, COVER ang ulo at leeg, HOLD ON","Huwag tumakbo palabas — ang debris ang tunay na panganib","Malayo sa mga bintana at mabibigat na kasangkapan","Sa labas: lumayo sa mga gusali at poste","Nagmamaneho: huminto malayo sa tulay"]},
    after:{en:["Expect aftershocks","Check home for cracks before re-entering","No lighters or matches — possible gas leak","Near coast: move to high ground immediately","Reconnect at your family's pre-arranged meeting point"],tl:["Asahan ang mga aftershock","Suriin ang bahay para sa mga bitak bago pumasok","Huwag gumamit ng lighter o posporo","Malapit sa dagat: pumunta agad sa mataas na lugar","Makipag-ugnayan sa pamilya sa naka-usapang meeting point"]}},

  { id:"bulkan", icon:"🌋", name:{en:"Volcano",tl:"Bulkan"},
    levels:{en:[{label:"Alert 1",desc:"Low activity. Monitor PHIVOLCS bulletins."},{label:"Alert 2",desc:"Growing unrest. Eruption possible."},{label:"Alert 3",desc:"Eruption imminent. Evacuate danger zone."},{label:"Alert 4",desc:"Hazardous eruption within hours or days."},{label:"Alert 5",desc:"Intense eruption ongoing. Follow NDRRMC orders."}],
             tl:[{label:"Alert 1",desc:"Mababang aktibidad. Bantayan ang PHIVOLCS."},{label:"Alert 2",desc:"Lumalaking gulo. Maaaring mag-erupt."},{label:"Alert 3",desc:"Malapit nang mag-erupt. Mag-evacuate sa danger zone."},{label:"Alert 4",desc:"Mapanganib na eruption sa loob ng ilang oras o araw."},{label:"Alert 5",desc:"Matinding eruption. Sundin ang lahat ng utos ng NDRRMC."}]},
    before:{en:["Know if you are in the Permanent Danger Zone","Stock N95 masks for ashfall","Prepare goggles for eye protection","Know evacuation routes away from the volcano","Protect crops and animals from ash"],tl:["Alamin kung nasa Permanent Danger Zone ka","Mag-imbak ng N95 masks para sa ashfall","Ihanda ang goggles para sa mata","Alamin ang evacuation routes palayo sa bulkan","Protektahan ang mga tanim at hayop mula sa abo"]},
    during:{en:["Evacuate immediately — do not wait","Wear N95 mask and cover your body","Close all windows, doors, and vents","Avoid driving in ashfall — visibility is dangerous","Stay in evacuation center until cleared"],tl:["Mag-evacuate agad — huwag mag-antay","Magsuot ng N95 mask at takpan ang katawan","Isara ang lahat ng bintana, pinto, at ventilation","Iwasang magmaneho sa ashfall","Manatili sa evacuation center hanggang ligtas"]},
    after:{en:["Clear ash from roof — it is heavy and can collapse it","Keep children away from ash","Check drinking water for ash contamination","Wait for PHIVOLCS all-clear before returning","Report respiratory cases to health center"],tl:["Linisin ang abo sa bubong — mabigat at mapanganib","Panatilihing malayo ang mga bata sa abo","Suriin ang inuming tubig","Hintayin ang all-clear mula sa PHIVOLCS","Iulat ang mga respiratory cases sa health center"]}},

  { id:"baha", icon:"💧", name:{en:"Flood",tl:"Baha"},
    levels:{en:[{label:"Advisory",desc:"Flooding possible in low areas."},{label:"Watch",desc:"Flooding likely within 6–12 hours. Prepare."},{label:"Warning",desc:"Flooding occurring or imminent. Evacuate now."},{label:"Flash Flood",desc:"Sudden mountain flood. Move away from rivers."}],
             tl:[{label:"Advisory",desc:"Posibleng mag-baha sa mababang lugar."},{label:"Watch",desc:"Maaaring mag-baha sa loob ng 6–12 oras. Maghanda."},{label:"Warning",desc:"Baha na o mabilis na darating. Mag-evacuate agad."},{label:"Flash Flood",desc:"Biglaang baha mula sa bundok. Lumayo agad sa mga ilog."}]},
    before:{en:["Check if your area is flood-prone","Elevate important items and documents","Know your nearest evacuation center","Don't sleep near rivers during heavy rain","Store food and water for 3 days"],tl:["Alamin kung flood-prone area ka","Itaas ang mga importanteng gamit at dokumento","Alamin ang pinakamalapit na evacuation center","Huwag matulog sa tabi ng ilog tuwing malakas ang ulan","Mag-imbak ng pagkain at tubig para sa 3 araw"]},
    during:{en:["Never walk or drive through floodwater","Stay away from rivers and drainage channels","Turn off electricity before water rises","Go upstairs if you cannot evacuate","Sealed plastic bottles can be an improvised life vest"],tl:["Huwag lumakad o magmaneho sa baha","Lumayo sa mga ilog at drainage","I-off ang kuryente bago tumaas ang tubig","Pumunta sa itaas kung hindi kayang lumabas","Sealed plastic bottles ay maaaring gamitin bilang life vest"]},
    after:{en:["Don't use tap water until confirmed safe","Watch for leptospirosis — don't wade barefoot","Clean and disinfect your home","Report missing persons to barangay","Get leptospirosis prophylaxis if exposed"],tl:["Huwag gumamit ng tubig sa gripo hanggang ligtas","Mag-ingat sa leptospirosis — huwag lumakad nang walang sapatos","Linisin at i-disinfect ang bahay","Iulat ang mga nawawala sa barangay","Humingi ng leptospirosis prophylaxis sa health center"]}},

  { id:"tsunami", icon:"🌊", name:{en:"Tsunami",tl:"Tsunami"},
    levels:{en:[{label:"Watch",desc:"Tsunami possible. Stay alert."},{label:"Warning",desc:"Evacuate to high ground immediately."},{label:"Natural Signs",desc:"Strong quake + sea receding = evacuate NOW."}],
             tl:[{label:"Watch",desc:"Posibleng may tsunami. Maging alerto."},{label:"Warning",desc:"Mag-evacuate agad sa mataas na lugar."},{label:"Natural Signs",desc:"Malakas na lindol + pagtaas/pagbaba ng dagat = mag-evacuate AGAD."}]},
    before:{en:["Know if your area is low-lying and coastal","Memorize routes to high ground","Learn natural signs — quake, sea rising or receding","Don't wait for official warning — nature warns first","Practice a family evacuation drill"],tl:["Alamin kung mababa ang inyong lugar at malapit sa dagat","Kabisahin ang evacuation route papunta sa mataas na lugar","Alamin ang mga natural na babala","Huwag hintayin ang opisyal na babala","Mag-practise ng family evacuation drill"]},
    during:{en:["Strong coastal quake? RUN to high ground now","By the time you see the wave, it is too late","Reach the highest point possible","Don't return after the first wave — more are coming","Stay until officially declared safe"],tl:["Malakas na lindol sa tabing-dagat? TUMAKBO agad","Kapag nakita mo na ang alon, huli na","Pumunta sa pinakamataas na lugar na maabot","Huwag bumalik pagkatapos ng unang alon","Manatili hanggang opisyal na ligtas na"]},
    after:{en:["Multiple waves will follow — stay at high ground","Watch for debris and live wires in water","Wait for PHIVOLCS/NDRRMC all-clear","Report missing to Coast Guard and barangay","Seek mental health support if experiencing trauma"],tl:["Maraming alon ang darating — manatili sa mataas na lugar","Mag-ingat sa debris at kuryente sa tubig","Hintayin ang all-clear mula sa PHIVOLCS/NDRRMC","Iulat ang mga nawawala sa Coast Guard","Humingi ng mental health support kung may trauma"]}},

  { id:"landslide", icon:"⛰", name:{en:"Landslide",tl:"Landslide"},
    levels:{en:[{label:"Advisory",desc:"Landslide possible in steep areas."},{label:"Warning",desc:"Prolonged heavy rain. Avoid mountains and cliffs."},{label:"Critical",desc:"Active landslide. Evacuate immediately."}],
             tl:[{label:"Advisory",desc:"Maaaring mag-landslide sa mga matarik na lugar."},{label:"Warning",desc:"Matagal na malakas na ulan. Lumayo sa bundok at bangin."},{label:"Critical",desc:"Aktibong landslide. Mag-evacuate agad."}]},
    before:{en:["Know if you live near steep slopes or rivers","Watch for ground or wall cracks","Don't build at the foot of steep mountains","Plan escape routes away from rivers","Watch for leaning or shifting trees"],tl:["Alamin kung nasa landslide-prone area ka","Bantayan ang mga crack sa lupa o dingding","Huwag magtayo sa ilalim ng matarik na bundok","Planuhin ang mga escape routes malayo sa mga ilog","Mag-ingat sa mga puno na nakahilig"]},
    during:{en:["Loud roar from the mountain? Move now","Run sideways — not in line with the flow","If trapped, go to the highest floor","Don't cross rivers if there's a landslide upstream","Sound is your warning — evacuate before you see it"],tl:["Malakas na tunog mula sa bundok? Lumipat na","Tumakbo sa tabi — hindi sa harap o likod ng daloy","Kung hindi makaalis, pumunta sa pinakamataas na palapag","Huwag tumawid sa ilog kung may landslide sa itaas","Ang tunog ang babala mo — mag-evacuate bago pa makita"]},
    after:{en:["Don't return — a second slide may follow","Watch for new cracks nearby","Report trapped persons to NDRRMC","Don't drink water from affected rivers","Join barangay clearing operations safely"],tl:["Huwag bumalik — maaaring may isa pang landslide","Bantayan ang mga bagong crack sa paligid","Iulat ang mga naka-entrap sa NDRRMC","Huwag uminom ng tubig mula sa mga apektadong ilog","Makiisa sa barangay clearing operations nang ligtas"]}},
];

const DEFAULT_GOBAG = {
  en:["Valid ID + document copies (waterproof bag)","3-day food supply — canned goods, crackers","3 liters of water per person per day","Maintenance medicine — 1 week supply","First aid kit — bandage, alcohol, betadine","Flashlight + spare batteries or dynamo","Battery-operated or hand-crank radio","Fully charged power bank","Extra clothes and a blanket","Whistle — to signal if trapped","Cash in a waterproof bag","N95 masks — at least 5 pieces"],
  tl:["Valid ID + kopya ng mga dokumento (waterproof bag)","3-araw na pagkain — de-lata, crackers","3 litro ng tubig per tao bawat araw","Maintenance medicine — 1 linggong supply","First aid kit — bandage, alcohol, betadine","Flashlight + spare batteries o dynamo","Battery-operated o hand-crank na radyo","Power bank na puno ang charge","Extra damit at kumot","Whistol — para mag-signal kung na-trap","Cash sa waterproof bag","N95 masks — kahit 5 piraso"],
};

const HOTLINES = [
  {name:"NDRRMC",       number:"911",              dial:"911",           desc:{en:"National Emergency",       tl:"Pambansang Emergency"}},
  {name:"PAGASA",       number:"(02) 8284-0800",   dial:"0282840800",    desc:{en:"Weather & Typhoon",        tl:"Panahon at Bagyo"}},
  {name:"PHIVOLCS",     number:"(02) 8426-1468",   dial:"0284261468",    desc:{en:"Earthquake & Volcano",     tl:"Lindol at Bulkan"}},
  {name:"Red Cross PH", number:"143",              dial:"143",           desc:{en:"Emergency Medical",        tl:"Emergency Medikal"}},
  {name:"Coast Guard",  number:"(02) 8527-3877",   dial:"0285273877",    desc:{en:"Maritime & Tsunami",       tl:"Dagat at Tsunami"}},
  {name:"DSWD",         number:"1-800-100-DSWD",   dial:"18001003793",   desc:{en:"Disaster Relief",          tl:"Relief at Tulong"}},
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
  return (
    <div style={{...glassCard(), display:"flex", padding:3, gap:2, borderRadius:12}}>
      {["en","tl"].map(l => (
        <button key={l} onClick={()=>setLang(l)} style={{
          padding:"5px 14px", borderRadius:10, border:"none",
          background: lang===l ? "rgba(255,255,255,0.22)" : "transparent",
          color: lang===l ? glass.white : glass.textSecond,
          fontWeight: lang===l ? 600 : 400,
          fontSize:12, cursor:"pointer", letterSpacing:0.8, fontFamily:font,
          transition:"all 0.2s", backdropFilter: lang===l ? "blur(10px)" : "none",
        }}>{l.toUpperCase()}</button>
      ))}
    </div>
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
        <div style={{color:glass.textPrimary, fontWeight:600, fontSize:16, fontFamily:font, marginBottom:5, letterSpacing:-0.2}}>{d.name[lang]}</div>
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
  const tabs = [{id:"levels",label:t.tabAlert},{id:"bago",label:t.tabBefore},{id:"during",label:t.tabDuring},{id:"after",label:t.tabAfter}];
  const content = {levels:d.levels[lang], bago:d.before[lang], during:d.during[lang], after:d.after[lang]};

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
            <div style={{color:glass.white, fontWeight:700, fontSize:26, fontFamily:font, letterSpacing:-0.5}}>{d.name[lang]}</div>
            <div style={{width:32, height:2.5, borderRadius:2, background:dc.h, marginTop:7, opacity:0.8}}/>
          </div>
        </div>

        <GlassTabs tabs={tabs} active={tab} setActive={setTab} accent={dc.h}/>
      </div>

      {/* Content */}
      <div style={{padding:"0 20px"}}>
        {tab==="levels" ? (
          <div style={{display:"flex", flexDirection:"column", gap:10}}>
            {d.levels[lang].map((lv,i)=>(
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
  const [items, setItems] = useState(DEFAULT_GOBAG[lang].map((item,i)=>({id:i,item,done:false,custom:false})));
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
                <div style={{color:glass.textSecond, fontSize:12, marginTop:2}}>{h.desc[lang]}</div>
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

// ─── Lightweight Philippines projection ────────────────────────
// Simple linear lat/lng → x/y box projection tuned to PH bounding box,
// good enough for a stylised offline pin map (not a literal coastline).
const PH_BOUNDS = { latMin:4.5, latMax:21.5, lngMin:116.5, lngMax:127 };
function project(lat, lng, w, h) {
  const x = ((lng - PH_BOUNDS.lngMin) / (PH_BOUNDS.lngMax - PH_BOUNDS.lngMin)) * w;
  const y = h - ((lat - PH_BOUNDS.latMin) / (PH_BOUNDS.latMax - PH_BOUNDS.latMin)) * h;
  return { x, y };
}

// Simplified PH landmass silhouette (stylised blob group, not geographically precise —
// purely for visual context behind the pins, fully offline / no map tiles needed)
const PH_SILHOUETTE = (
  <g fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.10)" strokeWidth="0.5">
    {/* Luzon */}
    <path d="M58 18 L66 14 L72 20 L70 32 L74 42 L68 56 L60 64 L52 70 L46 80 L40 88 L36 96 L40 100 L36 106 L28 108 L24 100 L28 90 L26 80 L30 68 L34 56 L38 44 L42 32 L48 24 Z"/>
    {/* Visayas cluster */}
    <path d="M44 118 L52 114 L60 118 L58 126 L50 130 L42 126 Z"/>
    <path d="M62 122 L70 120 L76 126 L72 134 L64 132 Z"/>
    <path d="M50 134 L58 132 L62 140 L56 146 L48 142 Z"/>
    {/* Mindanao */}
    <path d="M58 150 L70 146 L82 150 L88 160 L84 172 L74 180 L62 178 L52 170 L48 160 Z"/>
    {/* Palawan sliver */}
    <path d="M18 70 L24 68 L26 84 L22 100 L16 98 L14 84 Z"/>
  </g>
);

// ─── Map Pin (shared) ──────────────────────────────────────────
function MapPin({ x, y, active, color="#4A9EFF", size=1, onClick }) {
  return (
    <g transform={`translate(${x},${y})`} onClick={onClick} style={{cursor:onClick?"pointer":"default"}}>
      {active && <circle r={9*size} fill={color} opacity="0.25"><animate attributeName="r" values={`${6*size};${11*size};${6*size}`} dur="2s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.35;0.05;0.35" dur="2s" repeatCount="indefinite"/></circle>}
      <circle r={4.2*size} fill={color} stroke="rgba(8,12,18,0.8)" strokeWidth="1"/>
      <circle r={1.4*size} fill="rgba(255,255,255,0.9)"/>
    </g>
  );
}

// ─── Mini Map Preview (collapsed, tappable to expand) ──────────
function MiniMapPreview({ centers, onExpand }) {
  const W = 200, H = 170;
  return (
    <button onClick={onExpand} style={{
      width:"100%", border:"none", padding:0, cursor:"pointer",
      borderRadius:20, overflow:"hidden", position:"relative",
      background: glass.card,
      backdropFilter:"blur(20px) saturate(180%)",
      WebkitBackdropFilter:"blur(20px) saturate(180%)",
      border1:`1px solid ${glass.border}`,
    }}>
      <div style={{position:"relative", border:`1px solid ${glass.border}`, borderRadius:20, overflow:"hidden"}}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="170" style={{display:"block", background:"linear-gradient(160deg, rgba(20,40,70,0.5), rgba(10,20,35,0.7))"}}>
          {PH_SILHOUETTE}
          {centers.slice(0,60).map((c,i)=>{
            const p = project(c.lat, c.lng, W, H);
            return <MapPin key={i} x={p.x} y={p.y} color="#4A9EFF" size={0.7}/>;
          })}
        </svg>
        {/* Overlay gradient + label */}
        <div style={{
          position:"absolute", inset:0,
          background:"linear-gradient(180deg, transparent 0%, rgba(8,12,18,0.75) 100%)",
          display:"flex", flexDirection:"column", justifyContent:"flex-end",
          padding:"12px 16px",
        }}>
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
            <div>
              <div style={{color:glass.white, fontWeight:600, fontSize:13, fontFamily:font}}>{centers.length} centers mapped</div>
              <div style={{color:glass.textSecond, fontSize:11, marginTop:1}}>Tap to explore full map</div>
            </div>
            <div style={{
              width:32, height:32, borderRadius:10,
              background:"rgba(255,255,255,0.14)", backdropFilter:"blur(10px)",
              border:`1px solid ${glass.borderHi}`,
              display:"flex", alignItems:"center", justifyContent:"center",
              color:glass.white,
            }}>{Ico.expand}</div>
          </div>
        </div>
      </div>
    </button>
  );
}

// ─── Full Interactive Map Modal ─────────────────────────────────
function FullMapModal({ centers, onClose, t }) {
  const [selected, setSelected] = useState(null);
  const W = 300, H = 480;

  const openInGoogleMaps = (c) => {
    const url = c.lat && c.lng
      ? `https://www.google.com/maps/search/?api=1&query=${c.lat},${c.lng}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.name+' '+c.address+' Philippines')}`;
    window.open(url, "_blank");
  };

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:999,
      background:"rgba(5,8,14,0.92)",
      backdropFilter:"blur(10px)",
      display:"flex", flexDirection:"column",
      maxWidth:430, margin:"0 auto",
    }}>
      {/* Header */}
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", padding:"18px 20px 14px", flexShrink:0}}>
        <div>
          <div style={{color:glass.white, fontWeight:700, fontSize:18, fontFamily:font}}>Safe Zones Map</div>
          <div style={{color:glass.textSecond, fontSize:12, marginTop:2}}>{centers.length} evacuation centers</div>
        </div>
        <button onClick={onClose} style={{
          width:36, height:36, borderRadius:11,
          background:glass.card, backdropFilter:"blur(20px)",
          border:`1px solid ${glass.border}`,
          color:glass.white, cursor:"pointer",
          display:"flex", alignItems:"center", justifyContent:"center",
        }}>{Ico.close}</button>
      </div>

      {/* Map */}
      <div style={{flex:"0 0 auto", padding:"0 20px 14px", overflow:"hidden"}}>
        <div style={{
          position:"relative", borderRadius:20, overflow:"hidden",
          border:`1px solid ${glass.border}`,
          background:"linear-gradient(160deg, rgba(20,40,70,0.6), rgba(10,20,35,0.8))",
          maxHeight:"42vh",
        }}>
          <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{display:"block", maxHeight:"42vh"}}>
            <g fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.10)" strokeWidth="0.7" transform={`scale(${W/80},${H/170})`}>
              <path d="M58 18 L66 14 L72 20 L70 32 L74 42 L68 56 L60 64 L52 70 L46 80 L40 88 L36 96 L40 100 L36 106 L28 108 L24 100 L28 90 L26 80 L30 68 L34 56 L38 44 L42 32 L48 24 Z"/>
              <path d="M44 118 L52 114 L60 118 L58 126 L50 130 L42 126 Z"/>
              <path d="M62 122 L70 120 L76 126 L72 134 L64 132 Z"/>
              <path d="M50 134 L58 132 L62 140 L56 146 L48 142 Z"/>
              <path d="M58 150 L70 146 L82 150 L88 160 L84 172 L74 180 L62 178 L52 170 L48 160 Z"/>
              <path d="M18 70 L24 68 L26 84 L22 100 L16 98 L14 84 Z"/>
            </g>
            {centers.map((c,i)=>{
              const p = project(c.lat, c.lng, W, H);
              const isSel = selected===i;
              return (
                <MapPin key={i} x={p.x} y={p.y} active={isSel}
                  color={isSel ? "#F39C12" : "#4A9EFF"} size={isSel?1.3:1}
                  onClick={()=>setSelected(isSel?null:i)}/>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Selected center detail card */}
      {selected!==null && (
        <div style={{padding:"0 20px 14px", flexShrink:0}}>
          <div style={{...glassCard({padding:"14px 16px", borderRadius:16}), border:"1px solid rgba(243,156,18,0.35)"}}>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:10}}>
              <div style={{flex:1}}>
                <div style={{color:glass.textPrimary, fontWeight:600, fontSize:14, fontFamily:font, marginBottom:4}}>{centers[selected].name}</div>
                <div style={{color:glass.textSecond, fontSize:12, display:"flex", gap:5, alignItems:"center"}}>{Ico.pin}{centers[selected].address}</div>
                <div style={{display:"flex", gap:6, marginTop:8, flexWrap:"wrap"}}>
                  <Pill small>{centers[selected].type}</Pill>
                  <Pill small color="rgba(48,191,160,0.8)">👥 {centers[selected].capacity}</Pill>
                </div>
              </div>
              <button onClick={()=>openInGoogleMaps(centers[selected])} style={{
                background:"rgba(74,158,255,0.18)", border:"1px solid rgba(74,158,255,0.3)",
                borderRadius:11, padding:"8px 12px", color:"rgba(100,180,255,0.95)",
                fontWeight:600, fontSize:11, cursor:"pointer", fontFamily:font,
                display:"flex", alignItems:"center", gap:5, flexShrink:0, whiteSpace:"nowrap",
              }}>{Ico.maps} Open</button>
            </div>
          </div>
        </div>
      )}

      {/* Scrollable list below map */}
      <div style={{flex:1, overflowY:"auto", padding:"4px 20px 30px"}}>
        <div style={{color:glass.textTertiary, fontSize:10, fontWeight:600, letterSpacing:1.5, marginBottom:10, textTransform:"uppercase"}}>All Centers</div>
        <div style={{display:"flex", flexDirection:"column", gap:7}}>
          {centers.map((c,i)=>(
            <button key={i} onClick={()=>setSelected(i)} style={{
              textAlign:"left", border:"none", padding:0, cursor:"pointer", width:"100%",
            }}>
              <div style={{
                ...glassCard({padding:"11px 14px", borderRadius:14}),
                border: selected===i ? "1px solid rgba(243,156,18,0.4)" : `1px solid ${glass.border}`,
                background: selected===i ? "rgba(243,156,18,0.08)" : glass.card,
                display:"flex", alignItems:"center", gap:10,
              }}>
                <span style={{width:6,height:6,borderRadius:99,background:selected===i?"#F39C12":"#4A9EFF",flexShrink:0}}/>
                <div style={{flex:1, minWidth:0}}>
                  <div style={{color:glass.textPrimary, fontSize:13, fontWeight:500, fontFamily:font, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>{c.name}</div>
                  <div style={{color:glass.textTertiary, fontSize:11, marginTop:1}}>{c.city}</div>
                </div>
              </div>
            </button>
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
  const [lang, setLang] = useState("tl");
  const [screen, setScreen] = useState("home");
  const [selected, setSelected] = useState(null);
  const t = T[lang];

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
