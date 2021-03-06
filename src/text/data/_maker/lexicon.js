console.log( ' ' );
colors = ['\u001b[32m', '\u001b[39m'];
var lexiMain = [clean(buildLexi(lang))];
var lexiZip = [clean(buildLexi(lang, true))];
var lexiStd = [C._, C.mod0, 'main;', C._];
fs.writeFileSync(	path.join(PATH, lang, '/lexicon/index.ts'), lexiMain.concat(lexiStd).join(''));
fs.writeFileSync(	path.join(PATH, lang, '/lexicon/index.min.ts'), lexiZip.concat(lexiStd).join(''));
console.log( 'wrote', colors[0], 'lexicon file', colors[1], 'for language', '"'+lang+'"');
console.log( ' ' );
// put words which are NOT yet in other modules in the lexicon NOW
// the same function (without arguments) is used in the lexicon to add words which ARE in other modules LATER...
// TODO FIXME 'a' MUST NOT be a NU - it will be added by rules dict.
function lexicon(cat){
	var nrOnes = Object.keys(data.numbers.ones).filter(function(s){ return s!='a' })
	var did = {
		NN: data.nouns_inflect.NN.map(function(a){ return a[0]; }).concat(Object.keys(data.nouns_inflect.uncountables)),
		NNS: data.nouns_inflect.NN.map(function(a){ return a[1]; }),
		VBN: __VBN,
		VBD: data.verbs_conjugate.irregulars.map(function(o){ return o.past; }),
		VBG: data.verbs_conjugate.irregulars.map(function(o){ return o.gerund; }),
		RB: Object.keys(data.adverbs_decline).concat(Object.keys(data.adjectives_decline.adverb.to).map(function(s) {
			return data.adjectives_decline.adverb.to[s];
		})),
	}
	var lexiZip = {
		NNA: Object.keys(data.verbs_conjugate.irregularDoers).map(function(s){ return data.verbs_conjugate.irregularDoers[s];  }),
		NNAB: data.abbreviations.nouns,
		NNP: Object.keys(data.firstnames),
		PP: Object.keys(data.nouns.PP),
		PRP: Object.keys(data.nouns.PRP),
		CP: Object.keys(data.verbs_special.CP),
		MD: Object.keys(data.verbs_special.MD),
		VBP: data.verbs_conjugate.irregulars.map(function(o){ return o.infinitive; }),
		VBZ: data.verbs_conjugate.irregulars.map(function(o){ return o.present; }),
		JJR: Object.keys(data.adjectives_decline.comparative.to).map(function(s){ return data.adjectives_decline.comparative.to[s]; }),
		JJS: Object.keys(data.adjectives_decline.superlative.to).map(function(s){ return data.adjectives_decline.superlative.to[s]; }),
		JJ: data.adjectives_demonym.concat(
				Object.keys(data.adjectives_decline.adverb.no), Object.keys(data.adjectives_decline.adverb.to),
				Object.keys(data.adjectives_decline.comparative.to), Object.keys(data.adjectives_decline.superlative.to),
				Object.keys(data.adverbs_decline).map(function(s) { return data.adverbs_decline[s]; })
		),
		CD: nrOnes.concat(
			Object.keys(data.numbers.teens),
			Object.keys(data.numbers.tens),
			Object.keys(data.numbers.multiple),
			Object.keys(data.dates.months),
			Object.keys(data.dates.days)
		)
	}
	//::NODE::
	if (cat===1) {return [did,lexiZip]}
	//::

	if (!cat) {
		var toMain = function(key, o) {
			o[key].forEach(function(w) { if (w && !main[w]) {main[w] = key} });
		}
		// irregulars to main
		for (var key in did) { toMain(key, did) }
		for (var key in lexiZip) { toMain(key, lexiZip) }
		// zip to main
		for (var key in zip) {
			//::BROWSER::
			zip[key] = _.repl(zip[key], ['selves', 'self', 'thing', 'what', 'how', 'ing', 'ally', 'ily', 'ly', 'ever', 'er', 'ed', 'es']);
			//::
			toMain(key, zip);
		}

		// conjugate all phrasal verbs:
		var c = {};
		var splits, verb, particle, phrasal;
		for (var pv in data.phrasalVerbs) {
			splits = pv.split(' ');
			verb = splits.shift();
			particle = splits.join(' ');
			c = parents.verb(verb).conjugate();
			for (var tense in c) {
				if (tense != 'doer') {
					phrasal = c[tense] + ' ' + particle;
					main[phrasal] = data.schema.getTense(tense).tag;
				}
			}
		}
		// conjugate all verbs: (~8ms, triples the lexicon size)
		c = {};
		data.verbs.forEach(function(verb) {
			c = parents.verb(verb).conjugate();
			for (var tense in data.schema._tense) {
				if (c[tense] && !main[c[tense]]) {
					main[c[tense]] = data.schema.getTense(tense).tag;
				}
			}
		});
		// decline all adjectives to their adverbs_ (~13ms)
		// 'to_adverb','to_superlative','to_comparative'
		// to_methods are slightly more performant than .conjugate because we skip to_noun yet ...
		data.adjectives.concat(Object.keys(data.adjectives_decline.convertables)).forEach(function(adjective) {
			if (!main.hasOwnProperty(adjective)) {
				main[adjective] = 'JJ';
				var adj = parents.adjective(adjective);
				var o = { adverb: 'RB', comparative: 'JJR', superlative: 'JJS' };
				for (var k in o) {
					var tag = o[k];
					o[k] = adj[['to_',k].join('')];
					if (o[k] && o[k] !== adjective && !main[o[k]]) {
						main[k] = main[k] || 'RB';
					}
				}
			}
		});
		// Make sure CP are CP and not conjugated verb type
		// TODO FIXME
		lexiZip.CP.forEach(function(w) {
			main[w] = 'CP';
		});

		return main;
	} else if (cat in did) { return did[cat] }
	return [];
}

module.exports = function (lang, isZip) {
	var _lMain = {};
	var _lZip = {};
	// TODO
	//var parents = require('../parents');

	// Now let's handle the module names
	// for data modules index and lexicon
	var _names = maker.map(function(g) {
		return {
			_var: [((g.folder && g.folder != 'lexicon') ? g.folder+'_' : ''), g.id].join('').replace('_index',''),
			_req: (g.folder) ? path.join(g.folder, g.id) : g.id
		};
	});

	// require data modules for use in build
	// TODO
	function reqModule(o) { data[o._var] = require(['./', path.join(lang, o._req)].join('')); }
	//_names.forEach(reqModule);
	// TODO - rest of VBN should be in lexicon.js already - also for sl "// TODO adjectives_regular"
	var __VBN = dict.VBN.words.filter(function(o) { return (__.possible(o) && o.hasOwnProperty('ref')); }).map(__.val);

	// write the data modules INDEX for build, lexicon and as survey
	var names = [];
	var _exports = [];
	_names.forEach(function(o){
		if (o._var.indexOf('rules_') === 0) {
			// TODO - we could write a separate index for /rules/ - STUB not needed yet
		} else {
			names.push( C._var, o._var, C.req1, o._req, C.req2 );
			_exports.push(C.tab, o._var, C.col, o._var, ',', C._);
		}
	});

	var exportStr = _exports.join('').slice(0,-2);
	names.push(C._, C.mod0, C.exp0, exportStr, C.exp2);
	fs.writeFileSync(	path.join(PATH, lang, '/index.ts'), '// data index for "'+ lang + '"\n' + names.join('')	);
	fs.writeFileSync(	path.join(PATH, lang, '/index.min.ts'), names.join('').replace(/'\);/gm, ".min');") );

	// now require this index module and other needed modules in the LEXICON
	var reqs = [
		C.l, C._,
		"import data = require('../index');", C._,
		"import parents = require('../../../parents'); // TODO - does not exist yet", C._, //TODO
		C.main
	];
	var _did = lexicon(1);
	['EX', 'NN', 'NNS', 'CC', 'VBD', 'VBN', 'VBG', 'DT', 'IN', 'PP', 'UH', 'FW', 'RB', 'RBR', 'RBS'].forEach(function(cat) {
		_lMain[cat] = [];
		_lZip[cat] = [];
		if (dict.hasOwnProperty(cat) && dict[cat].hasOwnProperty('words')) {
			var dw = dict[cat].words.filter(__.possible);

			if (cat === 'NN') dw = dw.filter(function(o) {
				if (o.hasOwnProperty('meta') && o.meta.noVerb) {
					var checkLang = (o.meta.noVerb instanceof Array) ? o.meta.noVerb : Object.keys(o.meta.noVerb);
					return (Object.keys(data.nouns_inflect.uncountables).indexOf(o[lang]) < 0 && checkLang.indexOf(lang) > -1);
				}
				return false;
			});
			if (cat === 'NNS') dw = dw.filter(function(o) {
				return (Object.keys(data.nouns_inflect.uncountables).indexOf(o[lang]) < 0);
			});

			var possibleLexi = function(w) {
				if (_did[0].hasOwnProperty(cat)) {
					return (_did[0][cat].indexOf(w) < 0 && lexicon(cat).indexOf(w) < 0);
				}
				if (_did[1].hasOwnProperty(cat)) {
					return (_did[1][cat].indexOf(w) < 0 && lexicon(cat).indexOf(w) < 0);
				}
				return (lexicon(cat).indexOf(w) < 0);
			}

			_lMain[cat] = dw.map(__.val).filter(possibleLexi);
			var repl = function(a) { return _.repl(a, 0, ['selves', 'self', 'thing', 'what', 'how', 'ing', 'ally', 'ily', 'ly', 'ever', 'er', 'ed', 'es']); }
			_lZip[cat] = _lMain[cat].map(repl);
		}
	});

	var lexiconStr = util.inspect(((isZip) ? _lZip : _lMain), {depth: null});
	var genStr = lexicon.toString().replace(/\bVBN:\s*__VBN\s*,\s*\n*/g,'').replace('(cat)', '(cat?)'); // TODO ugly, FIXME
	reqs.push(C._exp, lexiconStr, C.un1, genStr, C.un2);
	lexiconStr = reqs.join('');
	_names.push('lexicon.ts');
}
