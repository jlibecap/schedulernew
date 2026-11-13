// Built-in cocktail library + parser. One recipe per line:
//   Name | Glass | Category | Base | Garnish | Method | amount unit Ingredient; amount unit Ingredient; ...
// Units: oz, dash, barspoon, tsp, leaves, each, ml, or "top" (e.g. "top Soda water"). Append "?" to an ingredient to make it optional.
// Ingredient names are mapped to inventory-matching keywords via MATCH below (unknown names match on their own words).

const SCOTCH = "scotch|single malt|blended whisky|laphroaig|glenfiddich|glenlivet|macallan|johnnie walker|dewar|chivas|famous grouse|monkey shoulder";
const BRANDY = "brandy|cognac|hennessy|courvoisier|remy martin|martell|e&j|christian brothers";
const BUBBLES = "prosecco|champagne|sparkling|cava|brut|mionetto|korbel|veuve|moet|moët|la marca";
export const MATCH = {
  gin: "gin", "old tom gin": "gin", vodka: "vodka", "white rum": "rum", "light rum": "rum", "dark rum": "rum", "aged rum": "rum", "gold rum": "rum", "spiced rum": "spiced rum|rum", "overproof rum": "rum", rum: "rum",
  "coconut rum": "coconut rum|malibu", "cachaça": "cachaca|cachaça|leblon|pitu", tequila: "tequila", "reposado tequila": "tequila", mezcal: "mezcal",
  bourbon: "bourbon|whiskey|whisky|rye", "rye whiskey": "rye|whiskey|whisky|bourbon", whiskey: "bourbon|whiskey|whisky|rye", scotch: SCOTCH, "islay scotch": SCOTCH, "irish whiskey": "irish whiskey|jameson|bushmills|tullamore|redbreast|powers",
  applejack: "applejack|calvados|apple brandy", brandy: BRANDY, cognac: BRANDY, pisco: "pisco",
  "sweet vermouth": "vermouth|carpano|cocchi", "dry vermouth": "vermouth|noilly|dolin", vermouth: "vermouth", campari: "campari", aperol: "aperol", "orange liqueur": "cointreau|triple sec|orange liqueur|curaçao|curacao|grand marnier",
  "orange curaçao": "curaçao|curacao|cointreau|triple sec|orange liqueur", "blue curaçao": "blue cura", "grand marnier": "grand marnier|cointreau|triple sec|orange liqueur",
  amaretto: "amaretto|disaronno", "coffee liqueur": "kahlua|kahlúa|coffee liqueur|tia maria|mr black", "irish cream": "baileys|irish cream", "green chartreuse": "chartreuse", "yellow chartreuse": "yellow chartreuse|chartreuse",
  "elderflower liqueur": "st-germain|st germain|st. germain|elderflower", "maraschino liqueur": "maraschino|luxardo", benedictine: "benedictine|b&b|dom benedictine", absinthe: "absinthe|pernod|herbsaint|st\\. george absinth",
  sambuca: "sambuca", "crème de cassis": "cassis", "creme de cassis": "cassis", "creme de menthe": "creme de menthe|crème de menthe|menthe", "creme de cacao": "creme de cacao|crème de cacao|cacao", "creme de violette": "violette|creme de violette",
  "blackberry liqueur": "creme de mure|crème de mûre|blackberry liqueur|chambord", "raspberry liqueur": "chambord|raspberry liqueur", "cherry liqueur": "cherry heering|heering|cherry liqueur|kirsch", "peach schnapps": "peach schnapps|peachtree",
  "melon liqueur": "midori|melon liqueur", "banana liqueur": "banana liqueur|creme de banane", "apple schnapps": "sour apple|apple schnapps|apple pucker", galliano: "galliano", drambuie: "drambuie", jagermeister: "jägermeister|jagermeister|jager",
  amaro: "amaro|averna|nonino|montenegro|cynar|ramazzotti", "amaro nonino": "nonino|amaro", fernet: "fernet", "gentian liqueur": "suze|salers|gentian", falernum: "falernum", orgeat: "orgeat", "pimm's": "pimm",
  sherry: "sherry|fino|amontillado|oloroso", port: "port|tawny|ruby port", "red wine": "red wine|merlot|cabernet|pinot noir|malbec|shiraz", "white wine": "white wine|chardonnay|sauvignon|pinot grigio|riesling",
  prosecco: BUBBLES, champagne: BUBBLES, "sparkling wine": BUBBLES, lillet: "lillet|cocchi americano", beer: "beer|lager|pilsner|corona|modelo|ale", stout: "guinness|stout|porter", "ginger ale": "ginger ale|canada dry",
  "ginger beer": "ginger beer|fever-tree ginger|gosling", "soda water": "soda water|club soda|soda|seltzer|topo chico|perrier|sparkling water", "tonic water": "tonic", cola: "cola|coke|pepsi", "lemon-lime soda": "sprite|7up|7-up|lemon-lime|lemon lime",
  "energy drink": "red bull|energy drink|monster", "iced tea": "iced tea|tea", lemonade: "lemonade", "hot water": "hot water|water", espresso: "espresso|coffee|cold brew",
  "simple syrup": "simple syrup|syrup", "honey syrup": "honey", "agave syrup": "agave|simple syrup|syrup", "raspberry syrup": "raspberry syrup|raspberry", grenadine: "grenadine", sugar: "sugar", "sugar cube": "sugar",
  "lime juice": "lime", "lemon juice": "lemon", "orange juice": "orange juice|oj", "grapefruit juice": "grapefruit", "pineapple juice": "pineapple", "cranberry juice": "cranberry", "apple juice": "apple juice",
  "tomato juice": "tomato juice|bloody mary mix|tomato", "passion fruit": "passion", "peach purée": "peach", "strawberry purée": "strawberry", "coconut cream": "coconut cream|cream of coconut|coco lopez|coconut milk",
  "heavy cream": "heavy cream|half and half|half & half|whipping cream|light cream|dairy cream", milk: "milk", "egg white": "egg", egg: "egg", "olive brine": "olive", bitters: "bitters", "orange bitters": "orange bitters|bitters",
  "peychaud's bitters": "peychaud|bitters", worcestershire: "worcestershire", "hot sauce": "hot sauce|tabasco|cholula", mint: "mint", basil: "basil", cucumber: "cucumber", lime: "lime", lemon: "lemon", orange: "orange", "orange slice": "orange",
  cherry: "cherry|maraschino cherr", olive: "olive", honey: "honey", ginger: "ginger", "cocktail onion": "onion", nutmeg: "nutmeg", cinnamon: "cinnamon", strawberry: "strawberr", blackberry: "blackberr", raspberry: "raspberr", "water": "water",
};

const LIB = `
Old Fashioned | Rocks | Stirred | Whiskey | Orange peel | Stir with ice until chilled, strain over a large cube. | 2 oz Bourbon; 0.25 oz Simple syrup; 2 dash Bitters
Manhattan | Coupe | Stirred | Whiskey | Cherry | Stir with ice, strain into a chilled coupe. | 2 oz Rye whiskey; 1 oz Sweet vermouth; 2 dash Bitters
Rob Roy | Coupe | Stirred | Whiskey | Cherry | Stir with ice, strain. | 2 oz Scotch; 1 oz Sweet vermouth; 2 dash Bitters
Negroni | Rocks | Stirred | Gin | Orange peel | Stir with ice, strain over a large cube. | 1 oz Gin; 1 oz Campari; 1 oz Sweet vermouth
Boulevardier | Rocks | Stirred | Whiskey | Orange peel | Stir with ice, strain over a large cube. | 1.5 oz Bourbon; 1 oz Campari; 1 oz Sweet vermouth
Old Pal | Coupe | Stirred | Whiskey | Lemon twist | Stir with ice, strain. | 1 oz Rye whiskey; 1 oz Campari; 1 oz Dry vermouth
Mezcal Negroni | Rocks | Stirred | Mezcal | Orange peel | Stir with ice, strain over a large cube. | 1 oz Mezcal; 1 oz Campari; 1 oz Sweet vermouth
White Negroni | Rocks | Stirred | Gin | Lemon twist | Stir with ice, strain over a large cube. | 1.5 oz Gin; 1 oz Lillet; 1 oz Gentian liqueur
Sazerac | Rocks | Stirred | Whiskey | Lemon peel | Rinse a chilled glass with absinthe, stir the rest with ice and strain in. | 2 oz Rye whiskey; 0.25 oz Simple syrup; 3 dash Peychaud's bitters; 0.25 oz Absinthe
Vieux Carré | Rocks | Stirred | Whiskey | Cherry | Stir with ice, strain over ice. | 0.75 oz Rye whiskey; 0.75 oz Cognac; 0.75 oz Sweet vermouth; 1 barspoon Benedictine; 2 dash Peychaud's bitters; 2 dash Bitters
Martinez | Coupe | Stirred | Gin | Orange twist | Stir with ice, strain. | 1.5 oz Old Tom gin; 1.5 oz Sweet vermouth; 0.25 oz Maraschino liqueur; 2 dash Orange bitters
Gin Martini | Martini | Stirred | Gin | Lemon twist or olive | Stir with ice until very cold, strain. | 2.5 oz Gin; 0.5 oz Dry vermouth
Vodka Martini | Martini | Stirred | Vodka | Olive | Stir (or shake) with ice, strain. | 2.5 oz Vodka; 0.5 oz Dry vermouth
Dirty Martini | Martini | Stirred | Vodka | Olives | Shake or stir with ice, strain. | 2.5 oz Vodka; 0.5 oz Dry vermouth; 0.5 oz Olive brine
Gibson | Martini | Stirred | Gin | Cocktail onion | Stir with ice, strain. | 2.5 oz Gin; 0.5 oz Dry vermouth
Vesper | Coupe | Stirred | Gin | Lemon twist | Shake with ice, strain. | 3 oz Gin; 1 oz Vodka; 0.5 oz Lillet
Bijou | Coupe | Stirred | Gin | Cherry | Stir with ice, strain. | 1 oz Gin; 1 oz Green chartreuse; 1 oz Sweet vermouth; 1 dash Orange bitters
Hanky Panky | Coupe | Stirred | Gin | Orange twist | Stir with ice, strain. | 1.5 oz Gin; 1.5 oz Sweet vermouth; 0.25 oz Fernet
Gin & It | Coupe | Stirred | Gin | Orange twist | Stir with ice, strain. | 2 oz Gin; 1 oz Sweet vermouth
Brooklyn | Coupe | Stirred | Whiskey | Cherry | Stir with ice, strain. | 2 oz Rye whiskey; 0.75 oz Dry vermouth; 0.25 oz Maraschino liqueur; 0.25 oz Amaro
Rusty Nail | Rocks | Stirred | Whiskey | Lemon twist | Build over ice, stir. | 1.5 oz Scotch; 0.75 oz Drambuie
Godfather | Rocks | Stirred | Whiskey | | Build over ice, stir. | 1.5 oz Scotch; 0.75 oz Amaretto
Stinger | Coupe | Stirred | Brandy | Mint sprig | Stir or shake with ice, strain. | 2 oz Cognac; 0.75 oz Creme de menthe
Toronto | Coupe | Stirred | Whiskey | Orange twist | Stir with ice, strain. | 2 oz Rye whiskey; 0.25 oz Fernet; 0.25 oz Simple syrup; 2 dash Bitters
Oaxaca Old Fashioned | Rocks | Stirred | Tequila | Orange peel | Stir with ice, strain over a large cube. | 1.5 oz Reposado tequila; 0.5 oz Mezcal; 0.25 oz Agave syrup; 2 dash Bitters
Rum Old Fashioned | Rocks | Stirred | Rum | Orange peel | Stir with ice, strain over a large cube. | 2 oz Aged rum; 0.25 oz Simple syrup; 2 dash Bitters
Blood and Sand | Coupe | Stirred | Whiskey | Orange peel | Shake with ice, strain. | 0.75 oz Scotch; 0.75 oz Cherry liqueur; 0.75 oz Sweet vermouth; 0.75 oz Orange juice
Bronx | Coupe | Stirred | Gin | Orange twist | Shake with ice, strain. | 1.5 oz Gin; 0.5 oz Dry vermouth; 0.5 oz Sweet vermouth; 1 oz Orange juice
Americano | Highball | Highball | Aperitif | Orange slice | Build over ice, top with soda. | 1 oz Campari; 1 oz Sweet vermouth; 2 oz Soda water
Garibaldi | Highball | Highball | Aperitif | Orange wedge | Build over ice, stir gently. | 1.5 oz Campari; 4 oz Orange juice
Margarita | Coupe or rocks | Sour | Tequila | Lime wheel | Shake with ice, strain over fresh ice. Salt the rim if you like. | 2 oz Tequila; 1 oz Orange liqueur; 1 oz Lime juice
Tommy's Margarita | Rocks | Sour | Tequila | Lime wheel | Shake with ice, strain over fresh ice. | 2 oz Tequila; 1 oz Lime juice; 0.5 oz Agave syrup
Cadillac Margarita | Rocks | Sour | Tequila | Lime wheel | Shake with ice, strain over fresh ice. | 2 oz Tequila; 0.75 oz Grand Marnier; 1 oz Lime juice; 0.25 oz Agave syrup
Daiquiri | Coupe | Sour | Rum | Lime wheel | Shake hard with ice, double strain. | 2 oz White rum; 1 oz Lime juice; 0.75 oz Simple syrup
Hemingway Daiquiri | Coupe | Sour | Rum | Grapefruit twist | Shake with ice, strain. | 2 oz White rum; 0.5 oz Maraschino liqueur; 1 oz Lime juice; 0.5 oz Grapefruit juice
Whiskey Sour | Rocks | Sour | Whiskey | Lemon wheel & cherry | Shake with ice, strain over fresh ice. | 2 oz Bourbon; 0.75 oz Lemon juice; 0.75 oz Simple syrup
New York Sour | Rocks | Sour | Whiskey | Lemon wheel | Shake, strain over ice, float red wine on top. | 2 oz Rye whiskey; 0.75 oz Lemon juice; 0.75 oz Simple syrup; 0.5 oz Red wine
Amaretto Sour | Rocks | Sour | Liqueur | Cherry | Shake with ice, strain over ice. | 1.5 oz Amaretto; 0.75 oz Bourbon; 1 oz Lemon juice; 0.5 oz Simple syrup
Pisco Sour | Coupe | Sour | Pisco | Bitters drops | Dry shake, then shake with ice, strain. | 2 oz Pisco; 1 oz Lime juice; 0.75 oz Simple syrup; 1 each Egg white; 2 dash Bitters
Clover Club | Coupe | Sour | Gin | Raspberries | Dry shake, then shake with ice, strain. | 2 oz Gin; 0.75 oz Lemon juice; 0.5 oz Raspberry syrup; 1 each Egg white
Bee's Knees | Coupe | Sour | Gin | Lemon twist | Shake with ice, strain. | 2 oz Gin; 0.75 oz Lemon juice; 0.75 oz Honey syrup
Gimlet | Coupe | Sour | Gin | Lime wheel | Shake with ice, strain. | 2 oz Gin; 0.75 oz Lime juice; 0.75 oz Simple syrup
Vodka Gimlet | Coupe | Sour | Vodka | Lime wheel | Shake with ice, strain. | 2 oz Vodka; 0.75 oz Lime juice; 0.75 oz Simple syrup
Southside | Coupe | Sour | Gin | Mint leaf | Shake with ice, double strain. | 2 oz Gin; 1 oz Lime juice; 0.75 oz Simple syrup; 6 leaves Mint
Gin Basil Smash | Rocks | Sour | Gin | Basil sprig | Muddle basil with lemon and syrup, add gin, shake, double strain over ice. | 2 oz Gin; 0.75 oz Lemon juice; 0.75 oz Simple syrup; 10 leaves Basil
Whiskey Smash | Rocks | Sour | Whiskey | Mint sprig | Muddle mint with lemon and syrup, add bourbon, shake, strain over crushed ice. | 2 oz Bourbon; 0.75 oz Lemon juice; 0.75 oz Simple syrup; 8 leaves Mint
Gold Rush | Rocks | Sour | Whiskey | | Shake with ice, strain over a large cube. | 2 oz Bourbon; 0.75 oz Lemon juice; 0.75 oz Honey syrup
Brown Derby | Coupe | Sour | Whiskey | Grapefruit twist | Shake with ice, strain. | 2 oz Bourbon; 1 oz Grapefruit juice; 0.5 oz Honey syrup
Sidecar | Coupe | Sour | Brandy | Sugar rim, orange twist | Shake with ice, strain. | 2 oz Cognac; 0.75 oz Orange liqueur; 0.75 oz Lemon juice
Between the Sheets | Coupe | Sour | Rum | Lemon twist | Shake with ice, strain. | 1 oz White rum; 1 oz Cognac; 1 oz Orange liqueur; 0.75 oz Lemon juice
Jack Rose | Coupe | Sour | Brandy | Lime wheel | Shake with ice, strain. | 2 oz Applejack; 0.75 oz Lime juice; 0.5 oz Grenadine
Ward Eight | Coupe | Sour | Whiskey | Cherry | Shake with ice, strain. | 2 oz Rye whiskey; 0.75 oz Lemon juice; 0.75 oz Orange juice; 0.25 oz Grenadine
Aviation | Coupe | Sour | Gin | Cherry | Shake with ice, strain. | 2 oz Gin; 0.5 oz Maraschino liqueur; 0.25 oz Creme de violette; 0.75 oz Lemon juice
Corpse Reviver No. 2 | Coupe | Sour | Gin | Lemon twist | Shake with ice, strain into a chilled glass rinsed with absinthe. | 1 oz Gin; 1 oz Orange liqueur; 1 oz Lillet; 1 oz Lemon juice; 0.25 oz Absinthe
Last Word | Coupe | Sour | Gin | Cherry | Shake with ice, strain. | 0.75 oz Gin; 0.75 oz Green chartreuse; 0.75 oz Maraschino liqueur; 0.75 oz Lime juice
Paper Plane | Coupe | Sour | Whiskey | | Shake with ice, strain. | 0.75 oz Bourbon; 0.75 oz Aperol; 0.75 oz Amaro Nonino; 0.75 oz Lemon juice
Naked and Famous | Coupe | Sour | Mezcal | | Shake with ice, strain. | 0.75 oz Mezcal; 0.75 oz Yellow chartreuse; 0.75 oz Aperol; 0.75 oz Lime juice
Division Bell | Coupe | Sour | Mezcal | Grapefruit twist | Shake with ice, strain. | 0.75 oz Mezcal; 0.75 oz Aperol; 0.5 oz Maraschino liqueur; 0.75 oz Lime juice
Penicillin | Rocks | Sour | Whiskey | Candied ginger | Shake blended scotch, lemon, honey with ice, strain over ice, float Islay scotch. | 2 oz Scotch; 0.75 oz Lemon juice; 0.75 oz Honey syrup; 0.25 oz Islay scotch
Cosmopolitan | Martini | Sour | Vodka | Orange twist | Shake with ice, strain. | 1.5 oz Vodka; 1 oz Orange liqueur; 0.5 oz Lime juice; 1 oz Cranberry juice
Lemon Drop | Martini | Sour | Vodka | Sugar rim, lemon twist | Shake with ice, strain. | 2 oz Vodka; 1 oz Orange liqueur; 0.75 oz Lemon juice; 0.25 oz Simple syrup
Bramble | Rocks | Sour | Gin | Blackberries | Shake gin, lemon, syrup, strain over crushed ice, drizzle liqueur on top. | 2 oz Gin; 1 oz Lemon juice; 0.5 oz Simple syrup; 0.5 oz Blackberry liqueur
Caipirinha | Rocks | Sour | Cachaça | Lime wedge | Muddle limes with syrup, add cachaça and crushed ice, stir. | 2 oz Cachaça; 1 each Lime; 0.5 oz Simple syrup
Caipiroska | Rocks | Sour | Vodka | Lime wedge | Muddle limes with syrup, add vodka and crushed ice, stir. | 2 oz Vodka; 1 each Lime; 0.5 oz Simple syrup
Cable Car | Coupe | Sour | Rum | Sugar rim, orange twist | Shake with ice, strain. | 1.5 oz Spiced rum; 0.75 oz Orange curaçao; 0.75 oz Lemon juice; 0.5 oz Simple syrup
Pegu Club | Coupe | Sour | Gin | Lime wheel | Shake with ice, strain. | 2 oz Gin; 0.75 oz Orange curaçao; 0.75 oz Lime juice; 1 dash Bitters; 1 dash Orange bitters
Mojito | Highball | Highball | Rum | Mint sprig | Gently muddle mint with syrup and lime, add rum and crushed ice, top with soda, stir. | 2 oz White rum; 1 oz Lime juice; 0.75 oz Simple syrup; 8 leaves Mint; top Soda water?
Mint Julep | Julep cup | Highball | Whiskey | Mint sprig | Muddle mint gently with syrup, add bourbon and crushed ice, stir until frosty. | 2.5 oz Bourbon; 0.25 oz Simple syrup; 8 leaves Mint
Gin & Tonic | Highball | Highball | Gin | Lime wedge | Build over ice, stir once. | 2 oz Gin; 4 oz Tonic water
Vodka Tonic | Highball | Highball | Vodka | Lime wedge | Build over ice, stir once. | 2 oz Vodka; 4 oz Tonic water
Tequila & Tonic | Highball | Highball | Tequila | Lime wedge | Build over ice, stir once. | 2 oz Tequila; 4 oz Tonic water
Vodka Soda | Highball | Highball | Vodka | Lime wedge | Build over ice. | 2 oz Vodka; 4 oz Soda water
Gin Rickey | Highball | Highball | Gin | Lime wedge | Build over ice, squeeze in lime. | 2 oz Gin; 0.5 oz Lime juice; top Soda water
Scotch & Soda | Highball | Highball | Whiskey | Lemon twist | Build over ice. | 2 oz Scotch; 4 oz Soda water
Whiskey Highball | Highball | Highball | Whiskey | Lemon twist | Build over ice, stir once. | 2 oz Bourbon; 4 oz Soda water
Whiskey Ginger | Highball | Highball | Whiskey | Lime wedge | Build over ice. | 2 oz Bourbon; 4 oz Ginger ale
Jack & Coke | Highball | Highball | Whiskey | Lime wedge | Build over ice. | 2 oz Bourbon; 4 oz Cola
Rum & Coke | Highball | Highball | Rum | Lime wedge | Build over ice. | 2 oz White rum; 4 oz Cola
Cuba Libre | Highball | Highball | Rum | Lime wedge | Build over ice, stir. | 2 oz White rum; 4 oz Cola; 0.5 oz Lime juice
Presbyterian | Highball | Highball | Whiskey | Lemon twist | Build over ice. | 2 oz Bourbon; 3 oz Soda water; 3 oz Ginger ale
Horse's Neck | Highball | Highball | Brandy | Long lemon peel | Build over ice. | 2 oz Cognac; 4 oz Ginger ale; 2 dash Bitters
Tom Collins | Collins | Highball | Gin | Lemon wheel | Shake first three with ice, strain over ice, top with soda. | 2 oz Gin; 1 oz Lemon juice; 0.5 oz Simple syrup; 3 oz Soda water
John Collins | Collins | Highball | Whiskey | Lemon wheel | Shake first three with ice, strain over ice, top with soda. | 2 oz Bourbon; 1 oz Lemon juice; 0.5 oz Simple syrup; 3 oz Soda water
Gin Fizz | Highball | Highball | Gin | Lemon wheel | Shake with ice, strain, top with soda. | 2 oz Gin; 1 oz Lemon juice; 0.5 oz Simple syrup; top Soda water
Ramos Gin Fizz | Collins | Highball | Gin | | Dry shake, shake with ice, strain, top with soda. | 2 oz Gin; 0.5 oz Lime juice; 0.5 oz Lemon juice; 1 oz Simple syrup; 1.5 oz Heavy cream; 1 each Egg white; top Soda water
Moscow Mule | Copper mug | Highball | Vodka | Lime wedge | Build over ice, stir. | 2 oz Vodka; 4 oz Ginger beer; 0.5 oz Lime juice
London Mule | Copper mug | Highball | Gin | Lime wedge | Build over ice, stir. | 2 oz Gin; 4 oz Ginger beer; 0.5 oz Lime juice
Mexican Mule | Copper mug | Highball | Tequila | Lime wedge | Build over ice, stir. | 2 oz Tequila; 4 oz Ginger beer; 0.5 oz Lime juice
Kentucky Mule | Copper mug | Highball | Whiskey | Mint sprig | Build over ice, stir. | 2 oz Bourbon; 4 oz Ginger beer; 0.5 oz Lime juice
Mezcal Mule | Copper mug | Highball | Mezcal | Lime wedge | Build over ice, stir. | 2 oz Mezcal; 4 oz Ginger beer; 0.5 oz Lime juice
Dark 'n' Stormy | Highball | Highball | Rum | Lime wedge | Build over ice, float the rum on top. | 2 oz Dark rum; 4 oz Ginger beer; 0.5 oz Lime juice
El Diablo | Highball | Highball | Tequila | Lime wedge | Build over ice, float the cassis on top. | 1.5 oz Tequila; 0.5 oz Creme de cassis; 0.5 oz Lime juice; 4 oz Ginger beer
Gin-Gin Mule | Highball | Highball | Gin | Mint sprig | Shake first four, strain over ice, top with ginger beer. | 1.5 oz Gin; 1 oz Lime juice; 0.75 oz Simple syrup; 6 leaves Mint; top Ginger beer
Paloma | Highball | Highball | Tequila | Grapefruit wedge | Build over ice, top with soda. | 2 oz Tequila; 3 oz Grapefruit juice; 0.5 oz Lime juice; top Soda water?
Ranch Water | Highball | Highball | Tequila | Lime wedge | Build over ice. | 2 oz Tequila; 0.5 oz Lime juice; top Soda water
Greyhound | Highball | Highball | Vodka | Grapefruit wedge | Build over ice. | 2 oz Vodka; 4 oz Grapefruit juice
Salty Dog | Highball | Highball | Gin | Salt rim | Build over ice. | 2 oz Gin; 4 oz Grapefruit juice
Screwdriver | Highball | Highball | Vodka | Orange slice | Build over ice. | 2 oz Vodka; 4 oz Orange juice
Harvey Wallbanger | Highball | Highball | Vodka | Orange slice | Build over ice, float Galliano. | 1.5 oz Vodka; 4 oz Orange juice; 0.5 oz Galliano
Cape Codder | Highball | Highball | Vodka | Lime wedge | Build over ice. | 1.5 oz Vodka; 4 oz Cranberry juice
Sea Breeze | Highball | Highball | Vodka | Lime wedge | Build over ice. | 1.5 oz Vodka; 3 oz Cranberry juice; 1 oz Grapefruit juice
Bay Breeze | Highball | Highball | Vodka | Lime wedge | Build over ice. | 1.5 oz Vodka; 2 oz Pineapple juice; 2 oz Cranberry juice
Tequila Sunrise | Highball | Highball | Tequila | Orange slice & cherry | Build over ice, pour grenadine slowly so it sinks. | 2 oz Tequila; 4 oz Orange juice; 0.5 oz Grenadine
Long Island Iced Tea | Collins | Highball | Mixed | Lemon wedge | Shake spirits and sour, strain over ice, top with cola. | 0.5 oz Vodka; 0.5 oz Gin; 0.5 oz White rum; 0.5 oz Tequila; 0.5 oz Orange liqueur; 0.75 oz Lemon juice; 0.5 oz Simple syrup; top Cola
Bloody Mary | Highball | Highball | Vodka | Celery & lemon | Roll gently with ice, strain over ice. | 2 oz Vodka; 4 oz Tomato juice; 0.5 oz Lemon juice; 2 dash Worcestershire; 2 dash Hot sauce
Michelada | Pint | Highball | Beer | Lime wedge, salt rim | Build in a salted glass over ice, top with beer. | 1 oz Lime juice; 2 dash Hot sauce; 2 dash Worcestershire; 12 oz Beer
Pimm's Cup | Highball | Highball | Liqueur | Cucumber, mint, orange | Build over ice with fruit. | 2 oz Pimm's; 4 oz Lemon-lime soda; 3 leaves Mint?
Chilcano | Highball | Highball | Pisco | Lime wheel | Build over ice. | 2 oz Pisco; 0.5 oz Lime juice; 4 oz Ginger ale; 2 dash Bitters
Porto Tonic | Wine glass | Highball | Wine | Mint, orange | Build over ice. | 2 oz Port; 4 oz Tonic water
Aperol Spritz | Wine glass | Sparkling | Aperitif | Orange slice | Build over ice, top with soda. | 3 oz Prosecco; 2 oz Aperol; 1 oz Soda water
Hugo Spritz | Wine glass | Sparkling | Aperitif | Mint & lime | Build over ice. | 1.5 oz Elderflower liqueur; 3 oz Prosecco; 2 oz Soda water; 4 leaves Mint
Campari Spritz | Wine glass | Sparkling | Aperitif | Orange slice | Build over ice. | 2 oz Campari; 3 oz Prosecco; 1 oz Soda water
Negroni Sbagliato | Rocks | Sparkling | Aperitif | Orange slice | Build over ice, top with prosecco. | 1 oz Campari; 1 oz Sweet vermouth; 2 oz Prosecco
French 75 | Flute | Sparkling | Gin | Lemon twist | Shake first three with ice, strain, top with champagne. | 1 oz Gin; 0.5 oz Lemon juice; 0.5 oz Simple syrup; 3 oz Champagne
Mimosa | Flute | Sparkling | Wine | | Pour juice first, top with sparkling wine. | 3 oz Champagne; 3 oz Orange juice
Bellini | Flute | Sparkling | Wine | | Pour puree first, top with prosecco. | 2 oz Peach purée; 4 oz Prosecco
Rossini | Flute | Sparkling | Wine | | Pour puree first, top with prosecco. | 2 oz Strawberry purée; 4 oz Prosecco
Kir | Wine glass | Sparkling | Wine | | Pour cassis, top with white wine. | 0.5 oz Creme de cassis; 4 oz White wine
Kir Royale | Flute | Sparkling | Wine | | Pour cassis, top with champagne. | 0.5 oz Creme de cassis; 4 oz Champagne
Champagne Cocktail | Flute | Sparkling | Brandy | Orange twist | Soak sugar cube in bitters, add cognac, top with champagne. | 1 each Sugar cube; 2 dash Bitters; 0.5 oz Cognac; 4 oz Champagne
Seelbach | Flute | Sparkling | Whiskey | Orange twist | Combine, top with champagne. | 1 oz Bourbon; 0.5 oz Orange liqueur; 7 dash Bitters; 7 dash Peychaud's bitters; 4 oz Champagne
Death in the Afternoon | Flute | Sparkling | Spirit | | Pour absinthe, top slowly with champagne. | 1.5 oz Absinthe; 4 oz Champagne
Black Velvet | Pint | Sparkling | Beer | | Pour stout, float champagne over a spoon. | 4 oz Stout; 4 oz Champagne
Sherry Cobbler | Rocks | Sparkling | Wine | Orange slice, berries | Shake, strain over crushed ice. | 3 oz Sherry; 0.5 oz Simple syrup; 1 each Orange slice
Mai Tai | Rocks | Tiki | Rum | Mint sprig & lime shell | Shake with ice, strain over crushed ice. | 2 oz Aged rum; 0.75 oz Lime juice; 0.5 oz Orange curaçao; 0.25 oz Orgeat; 0.25 oz Simple syrup
Piña Colada | Hurricane | Tiki | Rum | Pineapple wedge | Blend with ice or shake and strain over crushed ice. | 2 oz White rum; 1.5 oz Coconut cream; 3 oz Pineapple juice
Painkiller | Tiki mug | Tiki | Rum | Nutmeg | Shake with ice, strain over crushed ice. | 2 oz Dark rum; 4 oz Pineapple juice; 1 oz Orange juice; 1 oz Coconut cream
Jungle Bird | Rocks | Tiki | Rum | Pineapple wedge | Shake with ice, strain over ice. | 1.5 oz Dark rum; 1.5 oz Pineapple juice; 0.5 oz Lime juice; 0.75 oz Campari; 0.5 oz Simple syrup
Hurricane | Hurricane | Tiki | Rum | Orange slice & cherry | Shake with ice, strain over ice. | 2 oz White rum; 2 oz Dark rum; 2 oz Passion fruit; 1 oz Lime juice; 0.5 oz Simple syrup; 0.5 oz Grenadine
Zombie | Tiki mug | Tiki | Rum | Mint sprig | Shake with ice, strain over crushed ice. | 1 oz White rum; 1 oz Gold rum; 1 oz Dark rum; 0.75 oz Lime juice; 0.5 oz Grapefruit juice; 0.5 oz Falernum; 0.5 oz Grenadine
Planter's Punch | Highball | Tiki | Rum | Orange slice & cherry | Shake with ice, strain over ice. | 2 oz Dark rum; 1 oz Lime juice; 1 oz Orange juice; 1 oz Pineapple juice; 0.5 oz Grenadine; 2 dash Bitters
Scorpion | Tiki mug | Tiki | Rum | Orange slice | Shake with ice, strain over ice. | 2 oz White rum; 1 oz Brandy; 1.5 oz Orange juice; 1 oz Lemon juice; 0.5 oz Orgeat
Blue Hawaiian | Hurricane | Tiki | Rum | Pineapple wedge | Blend or shake, strain. | 1 oz White rum; 1 oz Blue curaçao; 2 oz Pineapple juice; 1 oz Coconut cream
Bahama Mama | Hurricane | Tiki | Rum | Orange slice | Shake with ice, strain over ice. | 1 oz Dark rum; 1 oz Coconut rum; 1 oz Orange juice; 2 oz Pineapple juice; 0.25 oz Grenadine
Rum Runner | Hurricane | Tiki | Rum | Orange slice & cherry | Shake with ice, strain over ice. | 1 oz White rum; 1 oz Dark rum; 1 oz Blackberry liqueur; 1 oz Banana liqueur; 2 oz Pineapple juice; 0.5 oz Grenadine
Singapore Sling | Highball | Tiki | Gin | Cherry & pineapple | Shake with ice, strain over ice. | 1.5 oz Gin; 0.5 oz Cherry liqueur; 0.25 oz Orange liqueur; 0.25 oz Benedictine; 4 oz Pineapple juice; 0.5 oz Lime juice
White Russian | Rocks | Creamy | Vodka | | Build over ice, float cream. | 2 oz Vodka; 1 oz Coffee liqueur; 1 oz Heavy cream
Black Russian | Rocks | Creamy | Vodka | | Build over ice, stir. | 2 oz Vodka; 1 oz Coffee liqueur
Espresso Martini | Martini | Creamy | Vodka | 3 coffee beans | Shake hard with ice, strain. | 2 oz Vodka; 1 oz Coffee liqueur; 1 oz Espresso
Mudslide | Rocks | Creamy | Vodka | Chocolate shavings | Shake with ice, strain over ice. | 1 oz Vodka; 1 oz Coffee liqueur; 1 oz Irish cream
Grasshopper | Coupe | Creamy | Liqueur | Mint leaf | Shake with ice, strain. | 1 oz Creme de menthe; 1 oz Creme de cacao; 1 oz Heavy cream
Brandy Alexander | Coupe | Creamy | Brandy | Grated nutmeg | Shake with ice, strain. | 1 oz Cognac; 1 oz Creme de cacao; 1 oz Heavy cream
Pink Squirrel | Coupe | Creamy | Liqueur | | Shake with ice, strain. | 1 oz Amaretto; 1 oz Creme de cacao; 1 oz Heavy cream
Irish Coffee | Mug | Hot | Whiskey | Whipped cream | Stir whiskey and sugar into hot coffee, float cream. | 1.5 oz Irish whiskey; 4 oz Espresso; 1 tsp Sugar; 1 oz Heavy cream
Hot Toddy | Mug | Hot | Whiskey | Lemon wheel & cinnamon | Stir in a mug with hot water. | 2 oz Bourbon; 0.5 oz Honey syrup; 0.5 oz Lemon juice; 4 oz Hot water
B-52 | Shot | Shot | Liqueur | | Layer in order over a spoon. | 0.5 oz Coffee liqueur; 0.5 oz Irish cream; 0.5 oz Orange liqueur
Kamikaze | Shot | Shot | Vodka | Lime wedge | Shake with ice, strain. | 1 oz Vodka; 1 oz Orange liqueur; 1 oz Lime juice
Jägerbomb | Pint | Shot | Liqueur | | Drop a shot of Jägermeister into the energy drink. | 1.5 oz Jagermeister; 4 oz Energy drink
Washington Apple | Shot | Shot | Whiskey | | Shake with ice, strain. | 1 oz Bourbon; 1 oz Apple schnapps; 1 oz Cranberry juice
Garden Spritz | Wine glass | Sparkling | Gin | Cucumber ribbon | Build over ice. | 1.5 oz Gin; 3 oz Prosecco; 1 oz Soda water; 2 oz Cucumber?
Virgin Mojito | Highball | Mocktail | None | Mint sprig | Muddle mint with lime and syrup, add ice, top with soda. | 1 oz Lime juice; 0.75 oz Simple syrup; 8 leaves Mint; top Soda water
Shirley Temple | Highball | Mocktail | None | Cherry | Build over ice. | 5 oz Ginger ale; 0.5 oz Grenadine
Arnold Palmer | Highball | Mocktail | None | Lemon wheel | Build over ice. | 4 oz Iced tea; 4 oz Lemonade
Roy Rogers | Highball | Mocktail | None | Cherry | Build over ice. | 6 oz Cola; 0.5 oz Grenadine
Virgin Piña Colada | Hurricane | Mocktail | None | Pineapple wedge | Blend with ice. | 3 oz Pineapple juice; 1.5 oz Coconut cream
Cinderella | Highball | Mocktail | None | Orange slice | Shake juices, strain over ice, top with soda. | 1 oz Orange juice; 1 oz Pineapple juice; 1 oz Lemon juice; 0.5 oz Grenadine; top Soda water
Virgin Mary | Highball | Mocktail | None | Celery & lemon | Roll with ice, strain over ice. | 5 oz Tomato juice; 0.5 oz Lemon juice; 2 dash Worcestershire; 2 dash Hot sauce
Cranberry Spritz | Wine glass | Mocktail | None | Lime wheel | Build over ice. | 3 oz Cranberry juice; 0.5 oz Lime juice; top Soda water
Ginger Lemonade | Highball | Mocktail | None | Lemon wheel | Shake lemon and syrup, strain over ice, top with ginger beer. | 1.5 oz Lemon juice; 1 oz Simple syrup; top Ginger beer
`;

export function parseIngredient(raw) {
  const m = raw.trim().match(/^(top|\d+(?:\.\d+)?)\s*(oz|dashes|dash|barspoon|tsp|leaves|each|ml)?\s+(.+)$/i);
  if (!m) return null;
  let label = m[3].trim(); const optional = label.endsWith("?"); if (optional) label = label.slice(0, -1).trim();
  const top = m[1].toLowerCase() === "top";
  const key = label.toLowerCase();
  return { label, match: MATCH[key] || key, amount: top ? 0 : Number(m[1]), unit: top ? "top" : (m[2] || "each").toLowerCase().replace("dashes", "dash"), optional: optional ? 1 : 0 };
}
export function parseRecipes(text) {
  const out = [];
  for (const line of text.split("\n")) {
    const parts = line.split("|").map((s) => s.trim());
    if (parts.length < 7 || !parts[0]) continue;
    const [name, glass, category, base, garnish, method] = parts, ings = parts.slice(6).join("|").split(";").map(parseIngredient).filter(Boolean);
    if (ings.length) out.push({ name, glass, category, base, garnish, method, ingredients: ings });
  }
  return out;
}
export const LIBRARY = parseRecipes(LIB);
