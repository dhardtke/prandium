// Ingredient grammar for Peggyjs
// Can be tested on https://peggyjs.org/online.html

Ingredient
  = quantity:Quantity? _ unit:Unit? _ description:$(.*) { return {quantity, unit, description}; }

Unit
  = unit:UnitString ("." / __) { return unit; }

// based on https://www.kochwiki.org/wiki/Zubereitung:Ma%C3%9Fe_und_Gewichte
UnitString
  = "g" / "Gramm"
  / "TL" / "Teelöffel" / "tsp" / "ts"
  / "EL" / "Esslöffel" / "tablespoon" / "tb" / "tbsp"
  / "Msp" / "Messerspitze"
  / "Pr" / "Prise" / "pn" / "pinch"
  / "kg" / "Kilogramm"
  / "l" / "L" / "Liter"
  / "ml" / "ML" / "Milliliter" / "millilitre"
  / "dl" / "Deziliter" / "decilitre"
  / "cl" / "Centiliter" / "centilitre"
  / "Ta" / "Tasse" / "c" / "cup"
  / "Pfund" / "lb" / "pound"
  / "Bd" / "Bund" / "bu" / "bunch"
  / "Tr" / "Tropfen" / "dr" / "drop"
  / "Spr" / "Spritzer" / "ds" / "dash"
  / "Schuss" / "Shot"
  / "Do" / "Dose" / "cn" / "can"
  / "Becher"

Quantity
  = RangeQuantity
  / SingleQuantity

SingleQuantity
  = VulgarFraction
  / a:Integer _ b:VulgarFraction { return a + b; }
  / Integer

RangeQuantity
  = from:SingleQuantity _ "-" _ to:SingleQuantity { return {from, to}; }

VulgarFraction
  = "¼" { return 1/4; }
  / "½" { return 1/2; }
  / "¾" { return 3/4; }
  / "⅐" { return 1/7; }
  / "⅑" { return 1/9; }
  / "⅒" { return 1/10; }
  / "⅓" { return 1/3; }
  / "⅔" { return 2/3; }
  / "⅕" { return 1/5; }
  / "⅖" { return 2/5; }
  / "⅗" { return 3/5; }
  / "⅘" { return 4/5; }
  / "⅙" { return 1/6; }
  / "⅚" { return 5/6; }
  / "⅛" { return 1/8; }
  / "⅜" { return 3/8; }
  / "⅝" { return 5/8; }
  / "⅞" { return 7/8; }
  / num:Integer "/" den:Integer { return num/den; }

Integer "integer"
  = _ [0-9]+ { return parseInt(text(), 10); }

_ "whitespace"
  = __*

__ "whitespace"
  = [ \t\n\r]
