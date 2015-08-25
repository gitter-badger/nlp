import _ = require("../../../nlp/fns");

/**
 * data module, autogenerated by grunt. <br>
 * change and contribute to dictionaryRules <br>
 *  <br>
 * regex rules and transforms for adverbs <br>
 *  <br>
 * @readonly
 * @module data/en/rules/adverb
 */


  var zip:any = { which: 
   { superlative: { matches: /..est$/, tag: 'RBS' },
     comparative: { matches: /..er$/, tag: 'RBR' } },
  adjective: 
   { to: 
      [ [ /bly$/i, 'ble' ],
        [ /gically$/i, 'gical' ],
        [ /([rsdh])ically$/i, '$1ical' ],
        [ /ically$/i, 'ic' ],
        [ /uly$/i, 'ue' ],
        [ /ily$/i, 'y' ],
        [ /(.{3})ly$/i, '$1' ] ] } }
export = (function () {
				var m = 'matches';
				[['adjective', 'to', [m, 'replacer']], ['which', [m, 'returns']]].forEach(function(a:any){
					var objKeys = a.pop();
					if (a[1]) { zip[a[0]][a[1]] = _.toObjDeep(zip[a[0]][a[1]], objKeys); }
					_.setObjKey(a, _.tokenFn(zip, a, 1), zip);
				});
				return zip;
			})();