/**
 * DSH 翻译 — 语言库
 * 200 种全球常用语言。code 采用 BCP-47 / ISO 639 编码。
 * 前 20 项为常用语言，在列表中优先展示。
 */
(function (root) {
  'use strict';

  // [code, 中文名, English name]
  var RAW = [
    // ---- 常用语言 1-20 ----
    ['zh-CN', '简体中文', 'Chinese (Simplified)'],
    ['zh-TW', '繁体中文', 'Chinese (Traditional)'],
    ['en', '英语', 'English'],
    ['ja', '日语', 'Japanese'],
    ['ko', '韩语', 'Korean'],
    ['es', '西班牙语', 'Spanish'],
    ['fr', '法语', 'French'],
    ['de', '德语', 'German'],
    ['ru', '俄语', 'Russian'],
    ['pt', '葡萄牙语', 'Portuguese'],
    ['it', '意大利语', 'Italian'],
    ['ar', '阿拉伯语', 'Arabic'],
    ['hi', '印地语', 'Hindi'],
    ['th', '泰语', 'Thai'],
    ['vi', '越南语', 'Vietnamese'],
    ['id', '印尼语', 'Indonesian'],
    ['ms', '马来语', 'Malay'],
    ['tr', '土耳其语', 'Turkish'],
    ['nl', '荷兰语', 'Dutch'],
    ['pl', '波兰语', 'Polish'],

    // ---- 21-40 ----
    ['uk', '乌克兰语', 'Ukrainian'],
    ['fa', '波斯语', 'Persian'],
    ['ur', '乌尔都语', 'Urdu'],
    ['he', '希伯来语', 'Hebrew'],
    ['el', '希腊语', 'Greek'],
    ['cs', '捷克语', 'Czech'],
    ['sk', '斯洛伐克语', 'Slovak'],
    ['hu', '匈牙利语', 'Hungarian'],
    ['ro', '罗马尼亚语', 'Romanian'],
    ['bg', '保加利亚语', 'Bulgarian'],
    ['sr', '塞尔维亚语', 'Serbian'],
    ['hr', '克罗地亚语', 'Croatian'],
    ['sl', '斯洛文尼亚语', 'Slovenian'],
    ['bs', '波斯尼亚语', 'Bosnian'],
    ['mk', '马其顿语', 'Macedonian'],
    ['sq', '阿尔巴尼亚语', 'Albanian'],
    ['lt', '立陶宛语', 'Lithuanian'],
    ['lv', '拉脱维亚语', 'Latvian'],
    ['et', '爱沙尼亚语', 'Estonian'],
    ['fi', '芬兰语', 'Finnish'],

    // ---- 41-60 ----
    ['sv', '瑞典语', 'Swedish'],
    ['no', '挪威语', 'Norwegian'],
    ['da', '丹麦语', 'Danish'],
    ['is', '冰岛语', 'Icelandic'],
    ['ga', '爱尔兰语', 'Irish'],
    ['cy', '威尔士语', 'Welsh'],
    ['gd', '苏格兰盖尔语', 'Scottish Gaelic'],
    ['mt', '马耳他语', 'Maltese'],
    ['eu', '巴斯克语', 'Basque'],
    ['ca', '加泰罗尼亚语', 'Catalan'],
    ['gl', '加利西亚语', 'Galician'],
    ['af', '南非荷兰语', 'Afrikaans'],
    ['sw', '斯瓦希里语', 'Swahili'],
    ['am', '阿姆哈拉语', 'Amharic'],
    ['so', '索马里语', 'Somali'],
    ['ha', '豪萨语', 'Hausa'],
    ['yo', '约鲁巴语', 'Yoruba'],
    ['ig', '伊博语', 'Igbo'],
    ['zu', '祖鲁语', 'Zulu'],
    ['xh', '科萨语', 'Xhosa'],

    // ---- 61-80 ----
    ['st', '塞索托语', 'Sesotho'],
    ['tn', '茨瓦纳语', 'Tswana'],
    ['ts', '聪加语', 'Tsonga'],
    ['ve', '文达语', 'Venda'],
    ['nso', '北索托语', 'Northern Sotho'],
    ['ss', '斯瓦蒂语', 'Swati'],
    ['sn', '绍纳语', 'Shona'],
    ['ny', '齐切瓦语', 'Chichewa'],
    ['rw', '卢旺达语', 'Kinyarwanda'],
    ['kg', '刚果语', 'Kongo'],
    ['ln', '林加拉语', 'Lingala'],
    ['lg', '卢干达语', 'Luganda'],
    ['wo', '沃洛夫语', 'Wolof'],
    ['ff', '富拉语', 'Fulah'],
    ['tw', '契维语', 'Twi'],
    ['ee', '埃维语', 'Ewe'],
    ['ti', '提格里尼亚语', 'Tigrinya'],
    ['om', '奥罗莫语', 'Oromo'],
    ['mg', '马达加斯加语', 'Malagasy'],
    ['sc', '撒丁语', 'Sardinian'],

    // ---- 81-100 ----
    ['co', '科西嘉语', 'Corsican'],
    ['fy', '西弗里西亚语', 'Western Frisian'],
    ['lb', '卢森堡语', 'Luxembourgish'],
    ['br', '布列塔尼语', 'Breton'],
    ['oc', '奥克语', 'Occitan'],
    ['rm', '罗曼什语', 'Romansh'],
    ['fo', '法罗语', 'Faroese'],
    ['kl', '格陵兰语', 'Kalaallisut'],
    ['se', '北萨米语', 'Northern Sami'],
    ['mi', '毛利语', 'Maori'],
    ['sm', '萨摩亚语', 'Samoan'],
    ['to', '汤加语', 'Tongan'],
    ['fj', '斐济语', 'Fijian'],
    ['haw', '夏威夷语', 'Hawaiian'],
    ['ty', '塔希提语', 'Tahitian'],
    ['qu', '克丘亚语', 'Quechua'],
    ['ay', '艾马拉语', 'Aymara'],
    ['gn', '瓜拉尼语', 'Guarani'],
    ['nah', '纳瓦特尔语', 'Nahuatl'],
    ['ht', '海地克里奥尔语', 'Haitian Creole'],

    // ---- 101-120 ----
    ['pap', '帕皮阿门托语', 'Papiamento'],
    ['be', '白俄罗斯语', 'Belarusian'],
    ['ka', '格鲁吉亚语', 'Georgian'],
    ['hy', '亚美尼亚语', 'Armenian'],
    ['az', '阿塞拜疆语', 'Azerbaijani'],
    ['kk', '哈萨克语', 'Kazakh'],
    ['ky', '吉尔吉斯语', 'Kyrgyz'],
    ['uz', '乌兹别克语', 'Uzbek'],
    ['tk', '土库曼语', 'Turkmen'],
    ['tg', '塔吉克语', 'Tajik'],
    ['mn', '蒙古语', 'Mongolian'],
    ['bo', '藏语', 'Tibetan'],
    ['ug', '维吾尔语', 'Uyghur'],
    ['ps', '普什图语', 'Pashto'],
    ['ku', '库尔德语', 'Kurdish'],
    ['ckb', '中库尔德语', 'Central Kurdish (Sorani)'],
    ['sd', '信德语', 'Sindhi'],
    ['pa', '旁遮普语', 'Punjabi'],
    ['gu', '古吉拉特语', 'Gujarati'],
    ['mr', '马拉地语', 'Marathi'],

    // ---- 121-140 ----
    ['ta', '泰米尔语', 'Tamil'],
    ['te', '泰卢固语', 'Telugu'],
    ['kn', '卡纳达语', 'Kannada'],
    ['ml', '马拉雅拉姆语', 'Malayalam'],
    ['si', '僧伽罗语', 'Sinhala'],
    ['ne', '尼泊尔语', 'Nepali'],
    ['as', '阿萨姆语', 'Assamese'],
    ['or', '奥迪亚语', 'Odia'],
    ['my', '缅甸语', 'Burmese'],
    ['km', '高棉语', 'Khmer'],
    ['lo', '老挝语', 'Lao'],
    ['jv', '爪哇语', 'Javanese'],
    ['su', '巽他语', 'Sundanese'],
    ['ceb', '宿务语', 'Cebuano'],
    ['tl', '菲律宾语', 'Filipino'],
    ['ilo', '伊洛卡诺语', 'Ilocano'],
    ['hil', '希利盖农语', 'Hiligaynon'],
    ['war', '瓦瑞语', 'Waray'],
    ['min', '米南加保语', 'Minangkabau'],
    ['ace', '亚齐语', 'Acehnese'],

    // ---- 141-160 ----
    ['ban', '巴厘语', 'Balinese'],
    ['bug', '布吉语', 'Buginese'],
    ['bcl', '比科尔语', 'Bikol'],
    ['pam', '邦板牙语', 'Kapampangan'],
    ['mni', '曼尼普尔语', 'Manipuri'],
    ['bho', '博杰普尔语', 'Bhojpuri'],
    ['mai', '迈蒂利语', 'Maithili'],
    ['sat', '桑塔利语', 'Santali'],
    ['ks', '克什米尔语', 'Kashmiri'],
    ['brx', '博多语', 'Bodo'],
    ['dz', '宗喀语', 'Dzongkha'],
    ['dv', '迪维希语', 'Dhivehi'],
    ['bal', '俾路支语', 'Balochi'],
    ['mzn', '马赞德兰语', 'Mazanderani'],
    ['glk', '吉拉基语', 'Gilaki'],
    ['prs', '达里语', 'Dari'],
    ['haz', '哈扎拉吉语', 'Hazaragi'],
    ['tt', '鞑靼语', 'Tatar'],
    ['ba', '巴什基尔语', 'Bashkir'],
    ['cv', '楚瓦什语', 'Chuvash'],

    // ---- 161-180 ----
    ['ce', '车臣语', 'Chechen'],
    ['os', '奥塞梯语', 'Ossetian'],
    ['ab', '阿布哈兹语', 'Abkhaz'],
    ['av', '阿瓦尔语', 'Avar'],
    ['kbd', '卡巴尔达语', 'Kabardian'],
    ['udm', '乌德穆尔特语', 'Udmurt'],
    ['mhr', '东马里语', 'Meadow Mari'],
    ['sah', '雅库特语', 'Yakut'],
    ['tyv', '图瓦语', 'Tuvan'],
    ['bxr', '布里亚特语', 'Buryat'],
    ['crh', '克里米亚鞑靼语', 'Crimean Tatar'],
    ['gag', '加告兹语', 'Gagauz'],
    ['vec', '威尼斯语', 'Venetian'],
    ['lmo', '伦巴底语', 'Lombard'],
    ['nap', '那不勒斯语', 'Neapolitan'],
    ['scn', '西西里语', 'Sicilian'],
    ['fur', '弗留利语', 'Friulian'],
    ['lij', '利古里亚语', 'Ligurian'],
    ['pms', '皮埃蒙特语', 'Piedmontese'],
    ['ast', '阿斯图里亚语', 'Asturian'],

    // ---- 181-200 ----
    ['an', '阿拉贡语', 'Aragonese'],
    ['ext', '埃斯特雷马杜拉语', 'Extremaduran'],
    ['mwl', '米兰德斯语', 'Mirandese'],
    ['szl', '西里西亚语', 'Silesian'],
    ['csb', '卡舒比语', 'Kashubian'],
    ['hsb', '上索布语', 'Upper Sorbian'],
    ['dsb', '下索布语', 'Lower Sorbian'],
    ['rue', '卢森尼亚语', 'Rusyn'],
    ['gsw', '瑞士德语', 'Swiss German'],
    ['bar', '巴伐利亚语', 'Bavarian'],
    ['ksh', '科隆语', 'Colognian'],
    ['nds', '低地德语', 'Low German'],
    ['frr', '北弗里西亚语', 'Northern Frisian'],
    ['stq', '萨特弗里西亚语', 'Saterland Frisian'],
    ['vls', '西弗拉芒语', 'West Flemish'],
    ['zea', '泽兰语', 'Zeelandic'],
    ['li', '林堡语', 'Limburgish'],
    ['wa', '瓦隆语', 'Walloon'],
    ['tpi', '托克皮辛语', 'Tok Pisin'],
    ['bi', '比斯拉马语', 'Bislama']
  ];

  var AUTO = { code: 'auto', zh: '自动检测', en: 'Detect language' };

  var LANGUAGES = RAW.map(function (row, i) {
    return {
      code: row[0],
      zh: row[1],
      en: row[2],
      popular: i < 20
    };
  });

  root.DSH_I18N = {
    auto: AUTO,
    list: LANGUAGES,
    byCode: (function () {
      var map = { auto: AUTO };
      LANGUAGES.forEach(function (l) { map[l.code] = l; });
      return map;
    })(),
    /** 用于 prompt 的语言全名，例如 "Hindi" */
    nameOf: function (code) {
      var l = root.DSH_I18N.byCode[code];
      return l ? l.en : code;
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
