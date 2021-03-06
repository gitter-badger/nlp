// 16 negate
var _ = require('../../nlp/_');
var __ = require('../_');
var dict = require('../dictionary');
var verbs_special;
module.exports = {
  id: 'negate',
  folder: 'lexicon',
  description: 'the complete negate data',
  // build
  zip: function(lang, isZip) {
    verbs_special = require('./')('verbsSpecial',lang);
    return __.val(dict.negate, {});
  },
  prefix: "import verbs_special = require('../verbs/special');\n",
  // convert it to an easier format
  unzip: function() {
    var negate = verbs_special.negate || {};
    for (var k in zip) { negate[k] = zip[k]; }
    for (var k in negate) { negate[negate[k]] = k; }
    return negate;
  }
};
