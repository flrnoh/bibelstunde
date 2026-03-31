document.addEventListener('DOMContentLoaded', () => {
  /*** 0) LOGIN ***/
  const USERS = {
    "BlockBar": "VelvetPour26",
    "riverside2026": "VelvetPour_27",
    "testbar123": "Bibelstunde_No5"
  };

  const SESSION_KEY = "bibelstundeAuth";

  const loginOverlay = document.getElementById('loginOverlay');
  const loginForm = document.getElementById('loginForm');
  const loginUser = document.getElementById('loginUser');
  const loginPass = document.getElementById('loginPass');
  const loginError = document.getElementById('loginError');

  function showLogin() {
    loginOverlay.classList.add('show');
    loginOverlay.setAttribute('aria-hidden', 'false');
    loginUser.focus();
  }

  function hideLogin() {
    loginOverlay.classList.remove('show');
    loginOverlay.setAttribute('aria-hidden', 'true');
  }

  function isAuthenticated() {
    return sessionStorage.getItem(SESSION_KEY) === "ok";
  }

  function setAuthenticated() {
    sessionStorage.setItem(SESSION_KEY, "ok");
  }

  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
    showLogin();
  }

  if (!isAuthenticated()) {
    showLogin();
  } else {
    hideLogin();
  }

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const user = loginUser.value.trim();
    const pass = loginPass.value.trim();

    if (!user || !pass) {
      loginError.textContent = "Bitte Zugangscode und Passwort eingeben.";
      return;
    }

    if (!USERS[user] || USERS[user] !== pass) {
      loginError.textContent = "Zugangscode oder Passwort ist falsch.";
      loginPass.value = "";
      return;
    }

    loginError.textContent = "";
    setAuthenticated();
    hideLogin();
  });

  /*** SETTINGS ***/
  const HISTORY_SIZE = 5;
  const RESET_HOUR = 5;
  const SCHNAPS = [222, 333, 444];
  const LONGPRESS_MS = 900;

  const BASES = ["Gin","Rum","Whiskey","Vodka","Tequila","Brandy","Liqueur","Wine","Bubbles"];
  const PRIMARY = new Set(["Gin","Rum","Whiskey","Vodka","Tequila","Brandy"]);

  /*** ELEMENTS ***/
  const wrap = document.getElementById('wrap');
  const numberEl = document.getElementById('number');
  const cocktailEl = document.getElementById('cocktail');
  const historyEl = document.getElementById('history');
  const overlay = document.getElementById('overlay');
  const goBtn = document.getElementById('overlayGo');
  const clearBtn = document.getElementById('overlayClear');
  const resetHotspot = document.getElementById('resetHotspot');

  /*** REZEPTE ***/
  const RECIPES = [
    { name:"Adonis*",page:460},{ name:"Agavoni*",page:492},{ name:"Alexander*",page:223},{ name:"Amaretto Sour*",page:390},{ name:"Americano*",page:250},{ name:"Aperol Sour*",page:391},{ name:"Aperol Spritz*",page:255},{ name:"Aviation*",page:392},{ name:"B&B*",page:493},{ name:"B-52*",page:316},{ name:"Baltimore Eggnog*",page:224},{ name:"Basequito*",page:196},{ name:"Batida de Maracuja*",page:184},{ name:"Bellini*",page:374},{ name:"Benton's Old Fashioned*",page:302},{ name:"Between The Sheets*",page:393},{ name:"Beuser & Angus Special*",page:394},{ name:"Bijou*",page:494},{ name:"Bijou You Me Too!*",page:495},{ name:"Black Russian*",page:496},{ name:"Blood & Sand*",page:284},{ name:"Bloody Caesar*",page:238},{ name:"Bloody Maria »Our Way«*",page:239},{ name:"Bloody Mary*",page:236},{ name:"Blue Blazer*",page:394},{ name:"Blue Blazer II*",page:395},{ name:"Blue Hawaii*",page:341},{ name:"Bombay Crushed*",page:185},{ name:"Bonnie Prince Charly*",page:197},{ name:"Boulevardier Cocktail*",page:497},{ name:"Bourbon Cocktail*",page:395},{ name:"Bramble*",page:396},{ name:"Brandy Crusta*",page:397},{ name:"Brandy Punch*",page:340},{ name:"Breakfast Martini*",page:398},{ name:"Bronx*",page:282},{ name:"Brooklyn*",page:461},{ name:"Buck's Fizz*",page:375},{ name:"Bull Shot*",page:240},{ name:"Caipirinha-Batida de Limao*",page:182},{ name:"Caipirissima de Uva*",page:186},{ name:"Cape Cod*",page:251},{ name:"Champagne Cocktail (Orig.)*",page:372},{ name:"Champagne Cocktail (Orig.)*",page:373},{ name:"Champagner Cocktail*",page:370},{ name:"Chao Praya*",page:198},{ name:"Chocolate Cocktail*",page:225},{ name:"Clover Club*",page:399},{ name:"Clubland*",page:462},{ name:"Coffee Cocktail*",page:226},{ name:"Contessa Negroni*",page:498},{ name:"Continental Sour*",page:401},{ name:"Corpse Reviver #2*",page:285},{ name:"Cosmopolitan*",page:406},{ name:"CouCou Comber*",page:400},{ name:"Creole Cocktail*",page:463},{ name:"Cuba Libre*",page:256},{ name:"Daiquiri*",page:407},{ name:"Daiquiri el Floridita (Daiquiri No.3)*",page:408},{ name:"Dark & Stormy*",page:257},{ name:"Demerara & Chocolate Smash*",page:409},{ name:"Derby Cocktail*",page:286},{ name:"Dry Martini Cocktail (Orig.)*",page:459},{ name:"East India Cocktail*",page:306},{ name:"El Diablo*",page:258},{ name:"El Presidente*",page:464},{ name:"Elk's Own*",page:410},{ name:"Empire Riverside Punch*",page:342},{ name:"Espresso Martini*",page:317},{ name:"Estilo Viejo*",page:307},{ name:"Fedora Punch*",page:343},{ name:"Feuerzangenbowle*",page:344},{ name:"Flying Kangaroo*",page:322},{ name:"Fogcutter*",page:345},{ name:"French 75*",page:376},{ name:"French Martini*",page:321},{ name:"Galliajito*",page:199},{ name:"Gansevoort Fizz*",page:200},{ name:"Garibaldi*",page:259},{ name:"Georgia*",page:411},{ name:"Gibson*",page:466},{ name:"Gimlet*",page:412},{ name:"Gimlet, Richmond*",page:414},{ name:"Gin & Tonic 6*",page:248},{ name:"Gin Basil Smash*",page:415},{ name:"Gin Daisy*",page:201},{ name:"Gin Fizz*",page:192},{ name:"Gin Fizz (Orig.)*",page:194},{ name:"Gin Julep*",page:273},{ name:"Greenpoint*",page:467},{ name:"Guyana Manhattan*",page:468},{ name:"Harvard*",page:469},{ name:"Harvey Wallbanger*",page:260},{ name:"Holland House*",page:287},{ name:"Hollands Sour*",page:416},{ name:"Horse's Neck*",page:261},{ name:"Hot Gin Punch*",page:346},{ name:"Improved Gin Cocktail*",page:308},{ name:"Income Tax Cocktail*",page:288},{ name:"Irish Coffee*",page:227},{ name:"Jack Rose*",page:417},{ name:"Jerez Old Fashioned & Passionfruit-Espuma*",page:309},{ name:"Jersey Flashlight Julep*",page:274},{ name:"Jet Pilot*",page:347},{ name:"Kir Royal*",page:377},{ name:"Knickerbocker*",page:418},{ name:"Kon-Tiki Tropical Itch*",page:350},{ name:"Lagerita*",page:202},{ name:"Last Rites*",page:422},{ name:"Last Word*",page:423},{ name:"Lemon & Vanilla Caipiroska*",page:187},{ name:"Lemonbalm Julep*",page:275},{ name:"London Buck*",page:262},{ name:"Long Island Ice Tea*",page:351},{ name:"Lucien Gaudin*",page:499},{ name:"Mai Tai, Don The Beachcomber*",page:352},{ name:"Mai Tai, Trader Vic's*",page:424},{ name:"Manhattan*",page:470},{ name:"Margarita*",page:386},{ name:"Margarita (Orig.)*",page:388},{ name:"Margarita, Morning*",page:427},{ name:"Margarita, Pineapple & Cardamom*",page:426},{ name:"Margarita, Tommy´s*",page:428},{ name:"Martinez*",page:472},{ name:"Martini Cocktail*",page:452},{ name:"Mary Pickford*",page:331},{ name:"Michelada*",page:241},{ name:"Mint Julep*",page:276},{ name:"Mojito*",page:203},{ name:"Mojito, Grilled Lime & Spice*",page:204},{ name:"Mojito, Raspberry*",page:205},{ name:"Moscow Mule*",page:263},{ name:"Mr. Hoshi´s Dry Martini*",page:474},{ name:"Mulata*",page:429},{ name:"Mystery Gardenia*",page:430},{ name:"National Guard Seventh Regiment Punch*",page:354},{ name:"Navy Grog*",page:355},{ name:"Negroni*",page:490},{ name:"Negroni Sbagliato*",page:379},{ name:"New Fashioned*",page:311},{ name:"New York Flip*",page:228},{ name:"New York Sour*",page:431},{ name:"Old Cuban*",page:380},{ name:"Old Fashioned*",page:296},{ name:"Orange & Thyme Daiquiri*",page:432},{ name:"Paloma*",page:264},{ name:"Pecan-Manhattan*",page:476},{ name:"Penicillin*",page:433},{ name:"Philadelphia Fish House Punch*",page:356},{ name:"Pimm´s No. 1 Cup*",page:265},{ name:"Piña Colada*",page:188},{ name:"Pirates´ Julep*",page:277},{ name:"Pisco Punch*",page:357},{ name:"Pisco Sour*",page:434},{ name:"Planter´s Punch (Orig.)*",page:336},{ name:"Porto Flip*",page:220},{ name:"Prince Of Wales*",page:381},{ name:"Queen´s Park Swizzle*",page:209},{ name:"Ramoz Gin Fizz*",page:210},{ name:"Red Snapper*",page:243},{ name:"Rusty Nail*",page:501},{ name:"Sazerac*",page:312},{ name:"Sex On The Beach*",page:325},{ name:"Side Car*",page:438},{ name:"Singapore Sling (Raffles Hotel)*",page:362},{ name:"Sloe Gin Silver Fizz*",page:213},{ name:"Smoky African Flip*",page:230},{ name:"Southside*",page:214},{ name:"Steinhäger Gold Fizz*",page:215},{ name:"Swimming Pool*",page:326},{ name:"Ti Punch (Petit Punch)*",page:440},{ name:"Tom Collins*",page:216},{ name:"Too Too*",page:232},{ name:"Toreador*",page:442},{ name:"Toronto*",page:313},{ name:"Treacle*",page:327},{ name:"Trident*",page:503},{ name:"Trio Infernale*",page:504},{ name:"Tulip Cocktail*",page:290},{ name:"Vesper*",page:482},{ name:"Vieux Carré*",page:483},{ name:"Violette Fizz*",page:217},{ name:"Whiskey Sour*",page:445},{ name:"White Lady*",page:446},{ name:"Yellow Boxer*",page:449},{ name:"Zombie, Don The Beachcomber*",page:365}
  ];
  const RECIPE_PAGES = [...new Set(RECIPES.map(r => r.page))].sort((a,b)=>a-b);
  const RECIPE_BY_PAGE = new Map(RECIPES.map(r => [r.page, r]));

  /*** NAME → Basen ***/
  const NAME_BASES = {
    "Adonis*": ["Wine"],
    "Agavoni*": ["Tequila","Liqueur","Wine"],
    "Alexander*": ["Brandy"],
    "Amaretto Sour*": ["Liqueur"],
    "Americano*": ["Wine","Liqueur"],
    "Aperol Sour*": ["Liqueur"],
    "Aperol Spritz*": ["Liqueur","Bubbles"],
    "Aviation*": ["Gin"],
    "B&B*": ["Brandy","Liqueur"],
    "B-52*": ["Liqueur"],
    "Baltimore Eggnog*": ["Whiskey","Brandy"],
    "Basequito*": ["Rum"],
    "Batida de Maracuja*": ["Rum","Liqueur"],
    "Bellini*": ["Bubbles","Liqueur"],
    "Benton's Old Fashioned*": ["Whiskey"],
    "Between The Sheets*": ["Brandy","Rum"],
    "Beuser & Angus Special*": ["Gin"],
    "Bijou*": ["Gin","Liqueur","Wine"],
    "Bijou You Me Too!*": ["Gin","Liqueur","Wine"],
    "Black Russian*": ["Vodka","Liqueur"],
    "Blood & Sand*": ["Whiskey","Wine"],
    "Bloody Caesar*": ["Vodka"],
    "Bloody Maria »Our Way«*": ["Tequila"],
    "Bloody Mary*": ["Vodka"],
    "Blue Blazer*": ["Whiskey"],
    "Blue Blazer II*": ["Whiskey"],
    "Blue Hawaii*": ["Rum","Vodka","Liqueur"],
    "Bombay Crushed*": ["Gin","Liqueur"],
    "Bonnie Prince Charly*": ["Whiskey"],
    "Boulevardier Cocktail*": ["Whiskey","Liqueur","Wine"],
    "Bourbon Cocktail*": ["Whiskey"],
    "Bramble*": ["Gin","Liqueur"],
    "Brandy Crusta*": ["Brandy"],
    "Brandy Punch*": ["Brandy"],
    "Breakfast Martini*": ["Gin","Liqueur"],
    "Bronx*": ["Gin","Wine"],
    "Brooklyn*": ["Whiskey","Liqueur","Wine"],
    "Buck's Fizz*": ["Bubbles"],
    "Bull Shot*": ["Vodka"],
    "Caipirinha-Batida de Limao*": ["Rum"],
    "Caipirissima de Uva*": ["Rum"],
    "Cape Cod*": ["Vodka"],
    "Champagne Cocktail (Orig.)*": ["Bubbles"],
    "Champagner Cocktail*": ["Bubbles"],
    "Chao Praya*": ["Rum","Liqueur"],
    "Chocolate Cocktail*": ["Brandy","Liqueur"],
    "Clover Club*": ["Gin"],
    "Clubland*": ["Gin"],
    "Coffee Cocktail*": ["Brandy","Wine"],
    "Contessa Negroni*": ["Gin","Liqueur","Wine"],
    "Continental Sour*": ["Whiskey","Wine"],
    "Corpse Reviver #2*": ["Gin","Liqueur","Wine"],
    "Cosmopolitan*": ["Vodka","Liqueur"],
    "CouCou Comber*": ["Rum"],
    "Creole Cocktail*": ["Whiskey","Liqueur","Wine"],
    "Cuba Libre*": ["Rum"],
    "Daiquiri*": ["Rum"],
    "Daiquiri el Floridita (Daiquiri No.3)*": ["Rum"],
    "Dark & Stormy*": ["Rum"],
    "Demerara & Chocolate Smash*": ["Rum","Liqueur"],
    "Derby Cocktail*": ["Gin"],
    "Dry Martini Cocktail (Orig.)*": ["Gin","Wine"],
    "East India Cocktail*": ["Brandy","Liqueur"],
    "El Diablo*": ["Tequila","Liqueur"],
    "El Presidente*": ["Rum","Wine","Liqueur"],
    "Elk's Own*": ["Whiskey","Wine"],
    "Empire Riverside Punch*": ["Rum"],
    "Espresso Martini*": ["Vodka","Liqueur"],
    "Estilo Viejo*": ["Whiskey"],
    "Fedora Punch*": ["Rum"],
    "Feuerzangenbowle*": ["Rum","Wine"],
    "Flying Kangaroo*": ["Rum","Vodka","Liqueur"],
    "Fogcutter*": ["Rum","Gin","Brandy"],
    "French 75*": ["Gin","Bubbles"],
    "French Martini*": ["Vodka","Liqueur"],
    "Galliajito*": ["Liqueur"],
    "Gansevoort Fizz*": ["Gin"],
    "Garibaldi*": ["Liqueur"],
    "Georgia*": ["Brandy"],
    "Gibson*": ["Gin","Wine"],
    "Gimlet*": ["Gin"],
    "Gimlet, Richmond*": ["Gin"],
    "Gin & Tonic 6*": ["Gin"],
    "Gin Basil Smash*": ["Gin"],
    "Gin Daisy*": ["Gin","Liqueur"],
    "Gin Fizz*": ["Gin"],
    "Gin Fizz (Orig.)*": ["Gin"],
    "Gin Julep*": ["Gin"],
    "Greenpoint*": ["Whiskey","Liqueur","Wine"],
    "Guyana Manhattan*": ["Whiskey","Wine"],
    "Harvard*": ["Brandy","Wine"],
    "Harvey Wallbanger*": ["Vodka","Liqueur"],
    "Holland House*": ["Gin","Liqueur"],
    "Hollands Sour*": ["Gin"],
    "Horse's Neck*": ["Whiskey"],
    "Hot Gin Punch*": ["Gin"],
    "Improved Gin Cocktail*": ["Gin","Liqueur"],
    "Income Tax Cocktail*": ["Gin","Wine"],
    "Irish Coffee*": ["Whiskey"],
    "Jack Rose*": ["Brandy","Liqueur"],
    "Jerez Old Fashioned & Passionfruit-Espuma*": ["Wine"],
    "Jersey Flashlight Julep*": ["Brandy"],
    "Jet Pilot*": ["Rum"],
    "Kir Royal*": ["Bubbles","Liqueur"],
    "Knickerbocker*": ["Rum","Liqueur"],
    "Kon-Tiki Tropical Itch*": ["Rum","Brandy"],
    "Lagerita*": ["Tequila"],
    "Last Rites*": ["Rum"],
    "Last Word*": ["Gin","Liqueur"],
    "Lemon & Vanilla Caipiroska*": ["Vodka"],
    "Lemonbalm Julep*": ["Gin"],
    "London Buck*": ["Gin"],
    "Long Island Ice Tea*": ["Vodka","Gin","Rum","Tequila","Brandy"],
    "Lucien Gaudin*": ["Gin","Liqueur","Wine"],
    "Mai Tai, Don The Beachcomber*": ["Rum","Liqueur"],
    "Mai Tai, Trader Vic's*": ["Rum","Liqueur"],
    "Manhattan*": ["Whiskey","Wine"],
    "Margarita*": ["Tequila","Liqueur"],
    "Margarita (Orig.)*": ["Tequila","Liqueur"],
    "Margarita, Morning*": ["Tequila","Liqueur"],
    "Margarita, Pineapple & Cardamom*": ["Tequila","Liqueur"],
    "Margarita, Tommy´s*": ["Tequila"],
    "Martinez*": ["Gin","Wine","Liqueur"],
    "Martini Cocktail*": ["Gin","Wine"],
    "Mary Pickford*": ["Rum","Liqueur"],
    "Michelada*": ["Bubbles"],
    "Mint Julep*": ["Whiskey"],
    "Mojito*": ["Rum"],
    "Mojito, Grilled Lime & Spice*": ["Rum"],
    "Mojito, Raspberry*": ["Rum"],
    "Moscow Mule*": ["Vodka"],
    "Mr. Hoshi´s Dry Martini*": ["Gin","Wine"],
    "Mulata*": ["Rum","Liqueur"],
    "Mystery Gardenia*": ["Rum"],
    "National Guard Seventh Regiment Punch*": ["Whiskey","Wine"],
    "Navy Grog*": ["Rum"],
    "Negroni*": ["Gin","Liqueur","Wine"],
    "Negroni Sbagliato*": ["Liqueur","Wine","Bubbles"],
    "New Fashioned*": ["Whiskey"],
    "New York Flip*": ["Whiskey","Wine"],
    "New York Sour*": ["Whiskey","Wine"],
    "Old Cuban*": ["Rum","Bubbles"],
    "Old Fashioned*": ["Whiskey"],
    "Orange & Thyme Daiquiri*": ["Rum"],
    "Paloma*": ["Tequila"],
    "Pecan-Manhattan*": ["Whiskey","Wine"],
    "Penicillin*": ["Whiskey"],
    "Philadelphia Fish House Punch*": ["Rum","Brandy"],
    "Pimm´s No. 1 Cup*": ["Liqueur"],
    "Piña Colada*": ["Rum","Liqueur"],
    "Pirates´ Julep*": ["Rum"],
    "Pisco Punch*": ["Brandy","Liqueur"],
    "Pisco Sour*": ["Brandy"],
    "Planter´s Punch (Orig.)*": ["Rum"],
    "Porto Flip*": ["Brandy","Wine"],
    "Prince Of Wales*": ["Whiskey","Bubbles"],
    "Queen´s Park Swizzle*": ["Rum"],
    "Ramoz Gin Fizz*": ["Gin"],
    "Red Snapper*": ["Gin"],
    "Rusty Nail*": ["Whiskey","Liqueur"],
    "Sazerac*": ["Whiskey"],
    "Sex On The Beach*": ["Vodka","Liqueur"],
    "Side Car*": ["Brandy","Liqueur"],
    "Singapore Sling (Raffles Hotel)*": ["Gin","Liqueur"],
    "Sloe Gin Silver Fizz*": ["Gin"],
    "Smoky African Flip*": ["Whiskey"],
    "Southside*": ["Gin"],
    "Steinhäger Gold Fizz*": ["Gin"],
    "Swimming Pool*": ["Rum","Vodka","Liqueur"],
    "Ti Punch (Petit Punch)*": ["Rum"],
    "Tom Collins*": ["Gin"],
    "Too Too*": ["Liqueur"],
    "Toreador*": ["Tequila","Liqueur"],
    "Toronto*": ["Whiskey","Liqueur"],
    "Treacle*": ["Rum","Liqueur"],
    "Trident*": ["Liqueur","Wine"],
    "Trio Infernale*": ["Gin","Liqueur"],
    "Tulip Cocktail*": ["Brandy","Liqueur"],
    "Vesper*": ["Gin","Vodka"],
    "Vieux Carré*": ["Whiskey","Brandy","Wine","Liqueur"],
    "Violette Fizz*": ["Gin","Liqueur"],
    "Whiskey Sour*": ["Whiskey"],
    "White Lady*": ["Gin","Liqueur"],
    "Yellow Boxer*": ["Rum","Liqueur"],
    "Zombie, Don The Beachcomber*": ["Rum"]
  };

  const RECIPE_BASES = {};
  for (const {name, page} of RECIPES){
    RECIPE_BASES[page] = [...(NAME_BASES[name] || [])];
  }

  const MULTI_PRIMARY = new Set();
  for (const {page} of RECIPES){
    const bases = RECIPE_BASES[page] || [];
    const primCount = bases.filter(b => PRIMARY.has(b)).length;
    if (primCount >= 2) MULTI_PRIMARY.add(page);
  }

  /*** STATE ***/
  const LS_BAR_FILTER_KEY = "bibelBarFilter";
  const LS_LAST_RESET = "bibelLastReset";
  let history = JSON.parse(localStorage.getItem('bibelHistory')) || [];
  let pool = JSON.parse(localStorage.getItem('bibelPool')) || shuffle([...RECIPE_PAGES]);
  let animating = false;

  let barExcludes = loadBarExcludes();
  let tempExcludes = new Set();
  let nextDrawExcludes = null;
  let lpTimer = null, suppressNextClick = false, startX=0, startY=0;
  const MOVE_TOL = 12;
  let lastRolledNumber = null;

  checkDailyReset();
  setInterval(checkDailyReset, 60 * 1000);
  renderHistory();

  /*** EVENTS ***/
  wrap.addEventListener('pointerdown', (e) => {
    if (loginOverlay.classList.contains('show')) return;
    if (overlay.classList.contains('show') || animating) return;
    startX = e.clientX; startY = e.clientY;
    lpTimer = setTimeout(() => {
      suppressNextClick = true;
      openOverlay();
    }, LONGPRESS_MS);
    wrap.setPointerCapture?.(e.pointerId);
  });

  wrap.addEventListener('pointermove', (e) => {
    if (!lpTimer) return;
    if (Math.abs(e.clientX-startX) > MOVE_TOL || Math.abs(e.clientY-startY) > MOVE_TOL){
      clearTimeout(lpTimer);
      lpTimer = null;
    }
  });

  wrap.addEventListener('pointerup', () => {
    if (lpTimer){
      clearTimeout(lpTimer);
      lpTimer = null;
    }
  });

  wrap.addEventListener('click', () => {
    if (loginOverlay.classList.contains('show')) return;
    if (suppressNextClick){
      suppressNextClick = false;
      return;
    }
    if (overlay.classList.contains('show') || animating) return;
    tryDraw();
  });

  document.addEventListener('keydown', (e) => {
    if (loginOverlay.classList.contains('show') && e.key === 'Escape') return;

    if (overlay.classList.contains('show') && e.code === 'Escape') {
      overlay.classList.remove('show');
    } else if (['Space','Enter'].includes(e.code)) {
      if (loginOverlay.classList.contains('show')) return;
      e.preventDefault();
      tryDraw();
    }
  });

  /*** OVERLAY ***/
  initOverlay();
  function initOverlay(){
    document.querySelectorAll('#overlay .opt').forEach(opt => {
      const base = opt.dataset.base;
      const pin = opt.querySelector('.pin');
      pin.classList.toggle('pinned', barExcludes.has(base));

      opt.addEventListener('click', (e) => {
        if (e.target === pin) return;
        opt.classList.toggle('active');
        if (opt.classList.contains('active')) tempExcludes.add(base);
        else tempExcludes.delete(base);
      });

      pin.addEventListener('click', (e) => {
        e.stopPropagation();
        if (pin.classList.toggle('pinned')) barExcludes.add(base);
        else barExcludes.delete(base);
        saveState();
      });
    });

    goBtn.addEventListener('click', () => {
      overlay.classList.remove('show');
      nextDrawExcludes = [...tempExcludes];
      tempExcludes.clear();
      syncOverlayUI();
      suppressNextClick = false;
    });

    clearBtn.addEventListener('click', () => {
      barExcludes.clear();
      tempExcludes.clear();
      syncOverlayUI();
      saveState();
    });
  }

  function openOverlay(){
    syncOverlayUI();
    overlay.classList.add('show');
  }

  function syncOverlayUI(){
    document.querySelectorAll('#overlay .opt').forEach(opt => {
      const base = opt.dataset.base;
      const pin = opt.querySelector('.pin');
      pin.classList.toggle('pinned', barExcludes.has(base));
      opt.classList.toggle('active', tempExcludes.has(base));
    });
  }

  /*** DRAW ***/
  function tryDraw(){
    if (animating) return;
    startRoll(2000);
  }

  function startRoll(durationMs){
    animating = true;
    const min = RECIPE_PAGES[0], max = RECIPE_PAGES[RECIPE_PAGES.length - 1];
    const start = performance.now();
    const ease = t => 1 - Math.pow(1 - t, 3);

    (function tick(now){
      const t = Math.min((now - start) / durationMs, 1);
      lastRolledNumber = Math.floor(min + Math.random() * (max - min + 1));
      numberEl.textContent = lastRolledNumber;

      if (t < 1){
        const delay = 35 + (180 - 35) * ease(t);
        setTimeout(() => requestAnimationFrame(tick), delay);
      } else {
        finishDraw();
      }
    })(start);
  }

  function finishDraw(temp = []){
    if (SCHNAPS.includes(lastRolledNumber)){
      const page = lastRolledNumber;
      const rec = RECIPE_BY_PAGE.get(page);
      numberEl.textContent = page;
      cocktailEl.textContent = rec ? rec.name.replace(/\*/g, "") : "Schnapszahl";
      history.unshift(page);
      history = history.slice(0, HISTORY_SIZE);
      renderHistory();
      saveState();
      celebrateSchnaps();
      animating = false;
      return;
    }

    if ((!temp || !temp.length) && Array.isArray(nextDrawExcludes)) {
      temp = nextDrawExcludes;
      nextDrawExcludes = null;
    }

    const allowed = new Set(BASES.filter(b => !barExcludes.has(b) && !temp.includes(b)));
    const anyFilterActive = (allowed.size !== BASES.length);

    const filtered = pool.filter(p => {
      if (!anyFilterActive) return true;
      const bases = RECIPE_BASES[p] || [];
      if (!bases.length) return false;
      if (MULTI_PRIMARY.has(p)) return false;
      return bases.every(b => allowed.has(b));
    });

    let workPool = filtered.length ? filtered : [];
    if (!workPool.length){
      numberEl.textContent = "🍸";
      cocktailEl.textContent = "Kein Drink passt zum aktuellen Filter.";
      animating = false;
      return;
    }

    const idx = (Math.random() * workPool.length) | 0;
    const page = workPool.splice(idx, 1)[0];

    pool = pool.filter(p => p !== page);
    if (!pool.length) pool = shuffle([...RECIPE_PAGES]);

    const rec = RECIPE_BY_PAGE.get(page);
    numberEl.textContent = page;
    cocktailEl.textContent = rec ? rec.name.replace(/\*/g, "") : "";

    history.unshift(page);
    history = history.slice(0, HISTORY_SIZE);
    renderHistory();
    saveState();

    animating = false;
  }

  /*** EFFEKTE ***/
  function celebrateSchnaps(){
    numberEl.classList.add('schnapszahl');
    megaConfetti();
    launchRockets(4);
    setTimeout(() => numberEl.classList.remove('schnapszahl'), 3000);
  }

  /*** RESET / STATE ***/
  function renderHistory(){
    historyEl.textContent = history.length ? ("Letzte: " + history.join(" • ")) : "";
  }

  function saveState(){
    localStorage.setItem('bibelHistory', JSON.stringify(history));
    localStorage.setItem('bibelPool', JSON.stringify(pool));
    localStorage.setItem(LS_LAST_RESET, new Date().toISOString());
    localStorage.setItem(LS_BAR_FILTER_KEY, JSON.stringify([...barExcludes]));
  }

  function checkDailyReset(){
    const last = localStorage.getItem(LS_LAST_RESET);
    const now = new Date();

    const dayKey = x => {
      const y = new Date(x);
      if (y.getHours() < RESET_HOUR) y.setDate(y.getDate() - 1);
      return y.toDateString();
    };

    if (!last) {
      localStorage.setItem(LS_LAST_RESET, now.toISOString());
      return;
    }

    const lastKey = dayKey(last);
    const nowKey = dayKey(now);

    if (nowKey !== lastKey){
      pool = shuffle([...RECIPE_PAGES]);
      history = [];
      barExcludes.clear();
      tempExcludes.clear();

      numberEl.textContent = "🍸";
      cocktailEl.textContent = "";
      renderHistory();
      syncOverlayUI();

      localStorage.setItem(LS_LAST_RESET, now.toISOString());
      saveState();
    }
  }

  function loadBarExcludes(){
    try {
      const raw = localStorage.getItem(LS_BAR_FILTER_KEY);
      if (!raw) return new Set();
      const arr = JSON.parse(raw);
      return new Set(Array.isArray(arr) ? arr : []);
    } catch {
      return new Set();
    }
  }

  resetHotspot.addEventListener('click', () => {
    if (confirm("Alles zurücksetzen und neuen Tag beginnen?")) {
      localStorage.clear();
      sessionStorage.removeItem(SESSION_KEY);
      numberEl.textContent = "🍸";
      cocktailEl.textContent = "";
      history = [];
      pool = [...RECIPE_PAGES];
      barExcludes.clear();
      tempExcludes.clear();
      renderHistory();
      syncOverlayUI();
      setTimeout(() => location.reload(), 300);
    }
  });

  /*** UTILS ***/
  function shuffle(a){
    for(let i = a.length - 1; i > 0; i--){
      const j = (Math.random() * (i + 1)) | 0;
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /*** KONFETTI & RAKETEN ***/
  const canvas = document.getElementById('confetti');
  const ctx = canvas.getContext('2d', { alpha: true });
  const particles = [];
  const rockets = [];
  const GOLD = '#c9a86a';

  function resize(){
    canvas.width = innerWidth;
    canvas.height = innerHeight;
  }
  resize();
  addEventListener('resize', resize);

  function confettiBurst({count=240, spread=Math.PI/2, pow=1, originX=.5, originY=.22} = {}){
    const W = innerWidth, H = innerHeight, ox = W * originX, oy = H * originY, maxLife = 110;
    for(let i = 0; i < count; i++){
      const angle = (-Math.PI/2) + (Math.random() - .5) * spread;
      const speed = (6 + Math.random() * 7) * pow;
      particles.push({
        x:ox, y:oy,
        vx:Math.cos(angle) * speed,
        vy:Math.sin(angle) * speed - 2,
        g:.22 + Math.random() * .18,
        size:2 + Math.random() * 3.5,
        color:GOLD,
        life:maxLife - Math.random() * 30,
        rot:Math.random() * Math.PI,
        vr:(Math.random() - .5) * .35
      });
    }
  }

  function megaConfetti(){
    setTimeout(() => confettiBurst({count:280, pow:1.15}), 320);
    setTimeout(() => confettiBurst({count:240, pow:1.05, originY:.24, spread:Math.PI*.8}), 460);
    setTimeout(() => confettiBurst({count:200, pow:1.2, originX:.18, originY:.28, spread:Math.PI*.7}), 620);
    setTimeout(() => confettiBurst({count:200, pow:1.2, originX:.82, originY:.28, spread:Math.PI*.7}), 680);
  }

  function launchRockets(n=3){
    const W = innerWidth, H = innerHeight;
    for(let i = 0; i < n; i++){
      rockets.push({
        x:W * (.25 + .5 * Math.random()),
        y:H * 1.05,
        vx:(Math.random() - .5) * 1.2,
        vy:-(10 + Math.random() * 4),
        tY:H * (.18 + .1 * Math.random()),
        trail:[],
        life:220,
        hue:GOLD
      });
    }
  }

  (function render(){
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = particles.length - 1; i >= 0; i--){
      const p = particles[i];
      p.vy += p.g;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      p.life--;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.life / 110);
      ctx.fillRect(-p.size, -p.size, p.size * 2, p.size * 2);
      ctx.restore();

      if (p.life <= 0) particles.splice(i, 1);
    }

    for (let i = rockets.length - 1; i >= 0; i--){
      const r = rockets[i];
      if (r.life <= 0){
        rockets.splice(i, 1);
        continue;
      }

      r.vy += .12;
      r.x += r.vx;
      r.y += r.vy;
      r.life--;
      r.trail.push({x:r.x, y:r.y});
      if (r.trail.length > 24) r.trail.shift();

      ctx.beginPath();
      for(let j = 0; j < r.trail.length; j++){
        const p = r.trail[j];
        if(j === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      ctx.strokeStyle = r.hue;
      ctx.lineWidth = 2;
      ctx.globalAlpha = .8;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(r.x, r.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.globalAlpha = 1;
      ctx.fill();

      if (r.y <= r.tY || r.vy >= -.2){
        r.life = 0;
        confettiBurst({
          count:170 + (Math.random() * 80 | 0),
          pow:1.15,
          originX:r.x / innerWidth,
          originY:r.y / innerHeight,
          spread:Math.PI * 1.2
        });
      }
    }

    requestAnimationFrame(render);
  })();
});
