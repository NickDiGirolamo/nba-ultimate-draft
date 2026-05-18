import { Player } from "../types";
import { currentSeasonHeadshotUrls } from "../data/current-season-headshots";

const STORAGE_KEY = "legends-draft-player-images-v2";

const wikiTitleOverrides: Record<string, string> = {
  "dwayne-wade-03-10": "Dwyane_Wade",
  "dwayne-wade-10-14": "Dwyane_Wade",
  "julius-erving": "Julius_Erving",
  "shaquille-o-neal": "Shaquille_O%27Neal",
  "shaquille-o-neal-magic": "Shaquille_O%27Neal",
  "shaquille-o-neal-lakers": "Shaquille_O%27Neal",
  "shaquille-o-neal-heat": "Shaquille_O%27Neal",
  "isiah-thomas": "Isiah_Thomas",
  "kevin-garnett-timberwolves": "Kevin_Garnett",
  "kevin-garnett-celtics": "Kevin_Garnett",
  "kareem-abdul-jabbar-bucks": "Kareem_Abdul-Jabbar",
  "kareem-abdul-jabbar-lakers": "Kareem_Abdul-Jabbar",
  "kobe-bryant-8": "Kobe_Bryant",
  "kobe-bryant-24": "Kobe_Bryant",
  "kevin-durant-thunder": "Kevin_Durant",
  "kevin-durant-warriors": "Kevin_Durant",
  "lebron-james-03-10": "LeBron_James",
  "lebron-james-heat": "LeBron_James",
  "lebron-james-14-18": "LeBron_James",
  "luka-doncic": "Luka_Don%C4%8Di%C4%87",
  "luka-doncic-mavs": "Luka_Don%C4%8Di%C4%87",
  "pascal-siakam": "Pascal_Siakam",
  "pascal-siakam-raptors": "Pascal_Siakam",
  "dikembe-mutombo": "Dikembe_Mutombo",
  "dikembe-mutombo-nuggets": "Dikembe_Mutombo",
  "yao-ming": "Yao_Ming",
  "tracy-mcgrady-raptors": "Tracy_McGrady",
  "tracy-mcgrady-magic": "Tracy_McGrady",
  "tracy-mcgrady-rockets": "Tracy_McGrady",
  "penny-hardaway": "Anfernee_Hardaway",
  "amar-e-stoudemire": "Amar%27e_Stoudemire",
  "amar-e-stoudemire-suns": "Amar%27e_Stoudemire",
  "amar-e-stoudemire-knicks": "Amar%27e_Stoudemire",
  "alonzo-mourning-hornets": "Alonzo_Mourning",
  "kyrie-irving": "Kyrie_Irving",
  "kyrie-irving-cavs": "Kyrie_Irving",
  "kyrie-irving-mavs": "Kyrie_Irving",
  "cj-mccollum-blazers": "CJ_McCollum",
  "chauncey-billups": "Chauncey_Billups",
  "walt-frazier": "Walt_Frazier",
  "drazen-petrovic": "Dra%C5%BEen_Petrovi%C4%87",
  "hedo-turkoglu": "Hedo_T%C3%BCrko%C4%9Flu",
};

const directImageOverrides: Record<string, string> = {
  "btg-stephen-curry":
    "https://files.sfchronicle.com/static-assets/compression-bot/1610092800_curry_rookie.JPG",
  "btg-james-harden-thunder":
    "https://www.oklahoman.com/gcdn/authoring/2010/01/05/NOKL/ghnewsok-OK-3429678-983faaec.jpeg",
  "caron-butler":
    "https://legacymedia.sportsplatform.io/images_root/slides/photos/000/987/062/107627939_display_image.jpg?1307086307",
  "courtney-lee-magic":
    "https://i.pinimg.com/736x/55/5b/4a/555b4af6107b37f31098c12b5b788630.jpg",
  "btg-russell-westbrook":
    "https://cdn.nba.com/teams/legacy/www.nba.com/thunder/sites/thunder/files/25_russell_extension_160804.jpg",
  "btg-damian-lillard":
    "https://s.yimg.com/ny/api/res/1.2/9Kzd94G6a7MTA.RWqhzAaA--/YXBwaWQ9aGlnaGxhbmRlcjt3PTQyMDtoPTEyMTA7Y2Y9d2VicA--/https://s.yimg.com/os/en_US/Sports/USA_Today/20130111_kkt_st3_023-d4908287419caf196264256465ea0d49",
  "btg-devin-booker":
    "https://www.azcentral.com/gcdn/-mm-/7eb562d56ad68b56865e9f7496b37dcb4eb7c9e8/c=862-0-4307-3445/local/-/media/2016/03/06/Phoenix/Phoenix/635928979644038638-booker.jpg",
  "btg-shai-gilgeous-alexander":
    "https://slamonline.com/wp-content/uploads/2018/11/shai4.jpg",
  "btg-kyrie-irving":
    "https://www.sandiegouniontribune.com/wp-content/uploads/migration/2012/05/15/00000169-0ced-dbbe-a16f-4eed95d10000.jpg?w=535",
  "btg-kevin-durant-thunder":
    "https://i.pinimg.com/564x/94/0e/a8/940ea8ac8bd8d13843f46368e105b5cf.jpg",
  "btg-jayson-tatum":
    "https://www.usatoday.com/gcdn/-mm-/b89c02324696686c4fdca6bd59ab70e8671f0d52/c=949-0-2567-2157/local/-/media/2018/05/14/USATODAY/USATODAY/636619331412964777-USATSI-10834273.jpg",
  "btg-lebron-james-03-10":
    "https://library.sportingnews.com/styles/crop_style_16_9_desktop_webp/s3/2024-02/nba-plain--9d8098d4-51bf-424e-9ff5-ea066753ebdd.jpeg.webp?itok=CzNmWD8J",
  "btg-kawhi-leonard":
    "https://legacymedia.sportsplatform.io/img/images/photos/003/482/799/hi-res-3bca937fcba84570ddfafab8543c7c3a_crop_north.jpg?1438189689&w=630&h=420",
  "btg-paul-george":
    "https://www.indystar.com/gcdn/-mm-/2db10cfe364e6bdce391a0ff37d7e71d3d6ca3d6/c=194-0-1735-1541/local/-/media/2018/04/19/INGroup/Indianapolis/636597460578449640-MNIBrd-03-26-2014-SP-1-B001-2014-03-25-IMG--13-PACERS-121013.jp-1-1-HC6S1NNI-L388205543-IMG--13-PACERS-121013.jp-1-1-HC6S1NNI.jpg",
  "btg-jimmy-butler-bulls":
    "https://i.pinimg.com/474x/3c/32/cc/3c32ccc8329712bf9b5e60874556ff8d.jpg",
  "btg-giannis-antetokounmpo":
    "https://fadeawayworld.net/wp-content/uploads/2021/07/giannis-antetokounmpos-blog-post-from-2013-is-truly-inspiring-i-was-wondering-if-they-would-send-me-to-the-d-league-1536x1024.jpg",
  "btg-nikola-jokic":
    "https://legacymedia.sportsplatform.io/img/images/photos/003/572/968/hi-res-801cc84855b4e46871f0c2c4a70bece3_crop_north.jpg?1455038631&w=630&h=420",
  "nikola-jokic-2023":
    "https://legacymedia.sportsplatform.io/img/images/photos/003/572/968/hi-res-801cc84855b4e46871f0c2c4a70bece3_crop_north.jpg?1455038631&w=630&h=420",
  "btg-anthony-davis":
    "https://platform.sbnation.com/wp-content/uploads/sites/2/chorus/uploads/chorus_asset/file/14212085/20130119_tjg_ah6_069.0.1358814165.jpg?quality=90&strip=all&crop=0.012500000000003%2C0%2C99.975%2C100&w=2400",
  "cj-mccollum-blazers":
    "https://media.gq.com/photos/56fe0a4d42f1abb10ad77965/master/pass/CJ-McCollum-Flex.jpg",
  "cedric-ceballos-suns":
    "https://cdn.nba.com/teams/legacy/www.nba.com/suns/sites/suns/files/ced_ceb_stats.jpg",
  "charlie-ward":
    "https://www.cleveland.com/resizer/v2/SSQ6HYHIQ5HV5NGNYNQ3BN6VIY.jpg?auth=a9ecd8a9ac895430d51766511cc73f4179c3a4c37f1c0244fb60b3ad9bb0bace&width=1280&smart=true&quality=90",
  "charles-oakley-knicks":
    "https://library.sportingnews.com/styles/twitter_card_120x120/s3/2025-01/ZO2.jpg?itok=rP7Nn7z1",
  "chandler-parsons-rockets":
    "https://slamonline.com/wp-content/uploads/2014/07/hi-res-454200577-chandler-parsons-of-the-houston-rockets-looks-on-during_crop_north.jpg",
  "antonio-davis-pacers":
    "https://www.indystar.com/gcdn/-mm-/2dccf3437f2427780fafe0126799bf3380dd7e6b/c=142-0-1011-1158/local/-/media/2018/06/08/INGroup/Indianapolis/636640616463451778-1830270.JPG?width=458&height=610&fit=crop&format=pjpg&auto=webp",
  "chet-walker":
    "https://cache.legacy.net/legacy/images/cobrands/legacyremembers/photos/490d9d59-600e-4f02-a467-4ef24ad1166d.jpgx?w=711&h=712&option=3",
  "clifford-robinson":
    "https://akns-images.eonline.com/eol_images/Entire_Site/2020729/rs_634x1024-200829100035-634-cliff-robinson.cm.82920.jpg?fit=around%7C634:1024&output-quality=90&crop=634:1024;center,top",
  "kwame-brown":
    "https://fadeawayworld.net/wp-content/uploads/2021/06/12487470100.jpg",
  "btg-joel-embiid":
    "https://www.billboard.com/wp-content/uploads/media/joel-embiid-11-of-the-philadelphia-76ers-2014-billboard-650.jpg?w=650&h=430&crop=1",
  "btg-dirk-nowitzki":
    "https://miro.medium.com/v2/resize:fit:1000/1*AH7Hm8DO5lh59515Ese8Uw.jpeg",
  "btg-kobe-bryant":
    "https://lakersdaily.com/wp-content/uploads/2020/06/106092057-1566487914671gettyimages-1095029036.jpg",
  "btg-kevin-garnett-timberwolves":
    "https://64.media.tumblr.com/c714adefa241f41ef70bcf6ad3a5a397/tumblr_inline_ouhw40H2Vc1up8ogc_1280.jpg",
  "btg-tracy-mcgrady-raptors":
    "https://www.nicekicks.com/files/2018/01/tracy-mcgrady-adididas-feet-you-wear-3.jpg",
  "byron-scott":
    "https://s.yimg.com/ny/api/res/1.2/JD8wx3r3FcZlYn0FRkiHDg--/YXBwaWQ9aGlnaGxhbmRlcjt3PTEyMDA7aD03MTk7Y2Y9d2VicA--/https://media.zenfs.com/en/lebron_wire_usa_today_sports_articles_234/45799262110d01842fbf6fd32857c688",
  "amar-e-stoudemire":
    "https://cdnph.upi.com/svc/sv/upi/57901340742905/2012/1/17025180e46528d6cae8df3bf4247290/NBA-fines-Stoudemire-50000.jpg",
  "amar-e-stoudemire-suns":
    "https://www.sun-sentinel.com/wp-content/uploads/migration/2015/07/15/6V6O5RVUEBDFFB7ZHREUDBZIMI.jpg?w=620",
  "amar-e-stoudemire-knicks":
    "https://cdnph.upi.com/svc/sv/upi/57901340742905/2012/1/17025180e46528d6cae8df3bf4247290/NBA-fines-Stoudemire-50000.jpg",
  "arvydas-sabonis-blazers":
    "https://vz.cnwimg.com/wp-content/uploads/2014/12/Arvydas-Sabonis.jpg",
  "alvin-robertson":
    "https://cdn.nba.com/manage/2025/09/GettyImages-22077237251-1.jpg",
  "al-harrington":
    "https://a.espncdn.com/photo/2015/0318/nba_g_harrington1_1296x729.jpg",
  "al-harrington-knicks":
    "https://elitesportsny.com/app/uploads/2020/06/GettyImages-84341724-scaled-e1591641118629.jpg",
  "al-harrington-warriors":
    "https://s.hdnux.com/photos/11/14/35/2410357/6/1920x0.jpg",
  "al-jefferson":
    "https://gbaike-image.cdn.bcebos.com/a8014c086e061d950a7ba7c619ac1dd162d9f3d35c8e/a8014c086e061d950a7ba7c619ac1dd162d9f3d35c8e_1_1?x-bce-process=image/format,f_auto",
  "al-jefferson-bobcats":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Al_Jefferson_Bobcats.jpg/1280px-Al_Jefferson_Bobcats.jpg",
  "buck-williams-nets":
    "https://cdn.nba.com/teams/legacy/www.nba.com/nets/sites/nets/files/05_buck_albert.jpg",
  "antoine-walker":
    "https://s.yimg.com/ny/api/res/1.2/HR11OwlOXmp97.WbU2oyxQ--/YXBwaWQ9aGlnaGxhbmRlcjt3PTYzMDtoPTQ3NDtjZj13ZWJw/https://media.zenfs.com/en/blogs/sptusnbaexperts/Please-keep-your-laughter-to-a-dull-roar.-Elsa-Getty-Images.jpg",
  "antawn-jamison":
    "https://sportshub.cbsistatic.com/i/r/2019/08/14/94e6f272-2902-413f-bf0b-5f0eea31b99d/thumbnail/1200x675/ca961306b9e45c84bd90a20e0556b663/antawn-jamison.jpg",
  "anthony-bennett":
    "https://s.yimg.com/ny/api/res/1.2/jlw9IyRO4KtmuuwUMfkRSw--/YXBwaWQ9aGlnaGxhbmRlcjt3PTY0MDtoPTQ4MjtjZj13ZWJw/https://s.yimg.com/os/en/blogs/sptusnbaexperts/AB101113.jpg",
  "anthony-mckie-76ers":
    "https://vz.cnwimg.com/wp-content/uploads/2014/11/Aaron-McKie.jpg?x87003",
  "anthony-mason-hornets":
    "https://cdn.nba.com/teams/legacy/www.nba.com/hornets/sites/hornets/files/150228_gameaction_04.jpg",
  "anderson-varejao":
    "https://i.redd.it/j7un02j6t3hb1.jpg",
  "andrew-bogut":
    "https://cdn.hoopsrumors.com/files/2016/07/USATSI_9181135.jpg",
  "andrew-bogut-bucks":
    "https://wisportsheroics.com/wp-content/uploads/2024/03/USATSI_5092652-scaled.jpg",
  "andrew-bynum":
    "https://cdn.nba.com/teams/legacy/www.nba.com/lakers/sites/lakers/files/legacy/photos/1112bynum500_16.jpg",
  "andrew-toney-76ers":
    "https://cdn.nba.com/teams/legacy/www.nba.com/sixers/sites/sixers/files/andrew_toney_on_defense.jpg",
  "andre-miller-nuggets":
    "https://content.wusa9.com/photo/2014/02/20/1392931069000-Andre-Miller-Wizards_4418659_ver1.0.jpg",
  "andris-biedrins":
    "https://www.denverpost.com/wp-content/uploads/2016/05/20100119__20100120_C05_SP20BKNNUGSADV.Ap1_.jpg?w=640",
  "andray-blatche":
    "https://upload.wikimedia.org/wikipedia/commons/9/90/Andray_Blatche.jpg",
  "ben-simmons":
    "https://s.yimg.com/ny/api/res/1.2/6gLOD33FWFZ.CabmnfWnSA--/YXBwaWQ9aGlnaGxhbmRlcjt3PTI0MDA7aD0xNjAwO2NmPXdlYnA-/https://s.yimg.com/os/creatr-uploaded-images/2021-06/7a1739a0-d293-11eb-b7ef-89d62d7a2801",
  "ben-gordon-bulls":
    "https://nationalbasketblogassociation.wordpress.com/files/2008/10/gordon_300_070104.jpg",
  "bill-laimbeer":
    "https://miro.medium.com/v2/resize:fit:1400/1*lEBPd61CJNJ-jFhQt6o0OQ.jpeg",
  "bobby-dandridge-bucks":
    "https://a2.espncdn.com/combiner/i?img=%2Fphoto%2F2017%2F0331%2Fr195477_1296x729_16%2D9.jpg",
  "bob-lanier-pistons":
    "https://people.com/thmb/06tUor_qEukJ1IMFt8tyD__rg_w=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():focal(649x99:651x101)/bob-lanier-2-34c2a29b2b854a369107ae116a618cf7.jpg",
  "brad-daugherty-cavs":
    "https://cdn3.sbnation.com/imported_assets/157319/1695872.jpg",
  "brook-lopez-nets":
    "https://www.usatoday.com/gcdn/media/USATODAY/USATODAY/2012/11/14/usp-nba_-minnesota-timberwolves-at-brooklyn-nets-3_4.jpg?width=506&height=673&fit=crop&format=pjpg&auto=webp",
  "brandon-ingram-pelicans":
    "https://external-preview.redd.it/the-pelicans-are-not-expected-to-offer-brandon-ingram-a-v0-6E4Lpjq4NYnqoTE01FruzKvHLsFKN5S3ViFyVSWXY1s.jpg?auto=webp&s=c35b738aacdc9a4a8c96894416925e989a7b543c",
  "dikembe-mutombo-nuggets":
    "https://cdn.nba.com/teams/legacy/www.nba.com/nuggets/sites/nuggets/files/getty-images-527295296.jpg?im=Resize=(640)",
  "lebron-james-03-10":
    "https://people.com/thmb/JniFF0gr_aiZGdimoMhcJBZy-Y8=/4000x0/filters:no_upscale():max_bytes(150000):strip_icc():focal(667x0:669x2)/gettyimages-2674798-2000-54630ad5a0da4f9183d390d943552844.jpg",
  "lebron-james-heat":
    "https://cdn.forumcomm.com/dims4/default/f093fbe/2147483647/strip/true/crop/4243x2829+0+78/resize/840x560!/quality/90/?url=https%3A%2F%2Ffcc-cue-exports-brightspot.s3.us-west-2.amazonaws.com%2Fduluthnewstribune%2Fbinary%2Fcopy%2F83%2F02%2F1ea484ecdcfcdcf43edcb4841755%2F930825-lebronjames0625-binary-1587828.jpg",
  "lebron-james-14-18":
    "https://videos.usatoday.net/Brightcove2/29906170001/2015/06/29906170001_4282564439001_USATSI-8601943.jpg?pubId=29906170001",
  "dwayne-wade-03-10":
    "https://64.media.tumblr.com/f6d35d71ea04dfd298926ad166aa1ec2/tumblr_q65qyn6DxT1uf9qj8o1_1280.jpg",
  "kareem-abdul-jabbar-bucks":
    "https://pbs.twimg.com/media/FBmMlNuWUAMFF-T.jpg",
  "kareem-abdul-jabbar-lakers":
    "https://preview.redd.it/why-do-we-all-agree-kareem-is-top-3-v0-4ma10uw8wpef1.jpeg?width=1080&crop=smart&auto=webp&s=67f366f809b22a4e23c33a4694bdb3808f48bb39",
  "kobe-bryant-8":
    "https://cdn.artphotolimited.com/images/67ceea65865e9b3b9ef7de2b/300x300/kobe-bryant-2001-nba-finals.jpg",
  "kobe-bryant-24":
    "https://people.com/thmb/DjhcXEV6R-f9jcpkaoTkgd0lWYY=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():focal(665x0:667x2)/kobe-bryant-n-2a3e767270fd44fa9e02b81117a207ba.jpg",
  "shaquille-o-neal-magic":
    "https://talksport.com/wp-content/uploads/2024/12/32-orlando-magic-portrait-standing-959900731.jpg?strip=all&w=644",
  "shaquille-o-neal-lakers":
    "https://preview.redd.it/who-would-you-rather-have-prime-shaq-or-prime-giannis-v0-d0ogt1n4r6pe1.jpg?width=640&crop=smart&auto=webp&s=d72c0c9849e683ce07b4bfbe0ed627556c0247c5",
  "shaquille-o-neal-heat":
    "https://a.espncdn.com/combiner/i?img=%2Fphoto%2F2016%2F0209%2Fr52022_1296x729_16%2D9.jpg",
  "shareef-abdour-rahim":
    "https://www.legends-mag.com/assets/images/slideshows//6/large/GettyImages-462663403.jpg",
  "shane-battier":
    "https://upload.wikimedia.org/wikipedia/commons/6/66/Shane_Battier_Houston.jpg",
  "shane-battier-heat":
    "https://preview.redd.it/i-know-this-is-random-but-shane-battier-is-my-favorite-heat-v0-gkkjzxzfqtw51.jpg?width=2682&format=pjpg&auto=webp&s=b072a01d0172e4b3be1ab76819d337451cff5f2d",
  "shawn-kemp":
    "https://images.squarespace-cdn.com/content/v1/5f6a2443c6004d000a8d74df/1601064096489-5253447VSV5RBED3EX5C/Shawn+Kemp+Seattle+Sonics.jpg",
  "shawn-marion-mavs":
    "https://a57.foxsports.com/statics.foxsports.com/www.foxsports.com/content/uploads/2020/02/1280/1280/0a043974-121013-SW-NBA-Shawn-Marion-PI.jpg?ve=1&tl=1",
  "shawn-bradley":
    "https://hips.hearstapps.com/hmg-prod/images/shawn-bradley-of-the-dallas-mavericks-during-the-game-news-photo-1616120129.?crop=1.00xw:0.665xh;0,0.189xh&resize=1200:*",
  "serge-ibaka-raptors":
    "https://platform.raptorshq.com/wp-content/uploads/sites/130/chorus/uploads/chorus_asset/file/8606403/646053072.jpg?quality=90&strip=all&crop=0,3.9250814332248,100,69.706840390879",
  "sean-elliott-spurs":
    "https://s.hdnux.com/photos/01/37/67/75/25132918/3/1920x0.jpg",
  "steve-francis":
    "https://platform.thedreamshake.com/wp-content/uploads/sites/160/chorus/uploads/chorus_asset/file/23060422/1296004841.jpg?quality=90&strip=all&crop=0,0,100,100",
  "steve-francis-magic":
    "https://static.wikia.nocookie.net/orlandomagicbasketball/images/5/58/Francis.jpg/revision/latest/scale-to-width-down/324?cb=20120817002312",
  "spencer-haywood-supersonics":
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRqZ4SlbzXM0ngRMpbL1RUlEQDaGyt-j_XRKQ&s",
  "kevin-durant-thunder":
    "https://i.ebayimg.com/images/g/h1oAAOSwTaBm-OO0/s-l400.jpg",
  "kevin-durant-warriors":
    "https://static01.nyt.com/images/2017/04/07/sports/07durant-web1/07durant-web1-articleLarge.jpg?quality=75&auto=webp&disable=upscale",
  "kevin-durant-suns":
    "https://cdn.nba.com/teams/uploads/sites/1610612756/2023/02/Free-Agency-Splashes_2885681440_nologo.png",
  "kevin-garnett-timberwolves":
    "https://www.twincities.com/wp-content/uploads/2015/11/20080318__cst_Kevin_Garnett_2_.jpg?w=640",
  "kevin-garnett-nets":
    "https://nbcsports.brightspotcdn.com/dims4/default/b82060f/2147483647/strip/true/crop/3695x2078+0+114/resize/1440x810!/quality/90/?url=https%3A%2F%2Fnbc-sports-production-nbc-sports.s3.us-east-1.amazonaws.com%2Fbrightspot%2Fcb%2F3b%2F96831d98eb7b1a9510187817a208%2Fcd0ymzcznguwzdbhnduynddiytjhm2yyzthlmtjjotqwyyznptbkytdiogjjntzlnthmntuyy2u1zwrjmta3mdm4odfh.jpeg",
  "kevin-mchale":
    "https://images.imagerenderer.com/images/artworkimages/mediumlarge/3/kevin-mchale-andrew-d-bernstein.jpg",
  "kevin-willis":
    "https://cdn.nba.com/teams/legacy/www.nba.com/hawks/sites/hawks/files/legacy/photos/HWK_Classic_Willis_11.jpg",
  "kenyon-martin":
    "https://netswire.usatoday.com/gcdn/authoring/images/smg/2024/12/27/SNET/77269200007-9-9488.jpeg?width=660&height=479&fit=crop&format=pjpg&auto=webp",
  "andre-drummond":
    "https://www.usatoday.com/gcdn/media/USATODAY/USATODAY/2013/05/12/2013-05-12-andre-drummond-1_1.jpg",
  "andrea-bargnani":
    "https://www.nydailynews.com/wp-content/uploads/migration/2013/07/07/VULAC5BR4PECV3ETLCE7ADCD3E.jpg",
  "ray-allen-sonics":
    "https://www.sportsnet.ca/wp-content/uploads/2013/07/allen_ray640.jpg",
  "ray-allen-celtics":
    "https://nbcsports.brightspotcdn.com/dims4/default/94a0041/2147483647/strip/true/crop/2949x1659+1+0/resize/1440x810!/quality/90/?url=https%3A%2F%2Fnbc-sports-production-nbc-sports.s3.us-east-1.amazonaws.com%2Fbrightspot%2F76%2F2d%2F9fe6d4ea810c7ee52fa76fce3282%2F145777952-e1470530876489.jpg",
  "ray-allen-heat":
    "https://content.khou.com/photo/2016/11/01/USATSI_7948137_1478009491385_6687844_ver1.0.jpg",
  "rafer-alston":
    "https://s.hdnux.com/photos/11/24/37/2443219/8/ratio2x3_1920.jpg",
  "raja-bell-suns":
    "https://i.redd.it/better-player-raja-bell-in-his-prime-or-grayson-allen-v0-7rr9v6q2k4dc1.jpg?width=1200&format=pjpg&auto=webp&s=c4a0dcfa9d6631de666a2c44544540f661d6c2a8",
  "sam-jones":
    "https://assets-cms.thescore.com/uploads/image/file/489638/w640xh480_GettyImages-125340831.jpg?ts=1640972089",
  "sam-perkins-sonics":
    "https://pbs.twimg.com/media/GQELzVYaQAQS6Rn.jpg",
  "reggie-evans":
    "https://static.ffx.io/images/w_744%2Ch_419%2Cc_fill%2Cg_auto:faces/q_86%2Cf_auto/2a027bd7c691c156c4357bd623a2a0cd2db725c1",
  "ricky-rubio":
    "https://www.usatoday.com/gcdn/media/USATODAY/USATODAY/2013/03/13/2013-03-13-ricky-rubio-4_3.jpg",
  "demarcus-cousins":
    "https://imageio.forbes.com/specials-images/dam/imageserve/889147320/960x0.jpg?height=491&width=711&fit=bounds",
  "dennis-rodman-pistons":
    "https://res.cloudinary.com/ybmedia/image/upload/c_crop,h_2000,w_1358,x_0,y_0/c_scale,f_auto,q_auto,w_700/v1/m/f/4/f467f1fe94bb4e70abf58cfe4132f4035fd188ca/drafted-detroit-pistons.jpg",
  "dennis-rodman-bulls":
    "https://legacymedia.sportsplatform.io/images_root/slides/photos/000/537/881/245838_original.jpg?1291222858",
  "dennis-rodman-spurs":
    "https://thesportsrush.com/wp-content/uploads/2023/03/6e4c4e38-untitled-design-2023-03-02t010156.986.jpg",
  "deron-williams":
    "https://www.ocregister.com/wp-content/uploads/migration/kpl/kplldb-05smith1large.jpg?w=640",
  "david-robinson":
    "https://image.tmdb.org/t/p/w500/iFhzUGajalDsdS7AkfK4F6LpnwL.jpg",
  "david-thompson":
    "https://i.namu.wiki/i/hNFVytdtLsXhOJ68mdwUs-4FyajnsMs9Oh0smJomKkDxEgy6dJzacAA18mH4r_lJI9O2XQ_JCeXZKdAWGy37Sw.webp",
  "david-lee":
    "https://s.hdnux.com/photos/01/64/71/67/30645746/3/rawImage.jpg",
  "dan-majerle":
    "https://static.wikia.nocookie.net/nba/images/4/4a/Dan_Majerle.jpg/revision/latest?cb=20241105173941",
  "daniel-gibson":
    "https://www.usatoday.com/gcdn/-mm-/552f6e4cceb810d6b35ba56394a5e3ad35048b63/c=0-6-2569-3431/local/-/media/2017/05/19/USATODAY/USATODAY/636307823655230159-USP-NBA--Cleveland-Cavaliers-at-New-Jersey-Nets.jpg",
  "danilo-gallinari-knicks":
    "https://cdn.bleacherreport.net/images_root/slides/photos/000/700/133/98152892_original.jpg?1297045801",
  "david-west":
    "https://s.yimg.com/ny/api/res/1.2/1URZLSMLOWz0JCnDcSJcJg--/YXBwaWQ9aGlnaGxhbmRlcjt3PTY0MDtoPTgwMDtjZj13ZWJw/https://s.yimg.com/os/en_us/News/Yahoo/ept_sports_nba_experts-811739762-1301064162.jpg",
  "david-west-pacers":
    "https://www.usatoday.com/gcdn/-mm-/d5907a2c378727829e8743bdeca7fec54b72a540/c=0-64-5177-2989/local/-/media/USATODAY/USATODAY/2014/12/04/635533130471223794-USATSI-8144002.jpg",
  "dave-bing-pistons":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Dave_bing_pistons_%28cropped%29.JPG/250px-Dave_bing_pistons_%28cropped%29.JPG",
  "dave-cowens":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Dave_Cowens.jpeg/250px-Dave_Cowens.jpeg",
  "dale-davis":
    "https://www.indystar.com/gcdn/-mm-/ad3236dbb47605e675bd7ebd3fee85fdf9e62dd3/c=0-0-2327-3103/local/-/media/2015/06/03/Indianapolis/Indianapolis/635689350679682332-GettyImages-1483241.jpg?width=458&height=610&fit=crop&format=pjpg&auto=webp",
  "de-aaron-fox-kings":
    "https://www.sportsnet.ca/wp-content/uploads/2023/03/Sacramento-Kings-guard-DeAaron-Fox-768x432.jpg",
  "demar-derozan-bulls":
    "https://cdn.nba.com/teams/legacy/www.nba.com/bulls/sites/bulls/files/derozan_swap_16x9_11.jpg",
  "demar-derozan-spurs":
    "https://a3.espncdn.com/combiner/i?img=%2Fphoto%2F2018%2F1030%2Fr455336_1296x729_16%2D9.jpg",
  "damon-stoudamire-raptors":
    "https://www.legends-mag.com/assets/media/issue_15/damon_stoudamire/_sizes/gettyimages-961024494_large_4.jpg",
  "danny-green":
    "https://www.si.com/.image/c_fill,w_720,ar_16:9,f_auto,q_auto,g_auto/MTY4MDI3NTIwNzc0Nzc2MDgx/danny-green-spurs-leadjpg.jpg",
  "danny-green-raptors":
    "https://content.api.news/v3/images/bin/c567da983bef7f288e40da081d4b27b6",
  "damian-lillard":
    "https://dailyevergreen.com/wp-content/uploads/2023/02/Damian_Lillard_51658256323_cropped.jpg",
  "danny-granger":
    "https://static.wikia.nocookie.net/nba/images/1/1d/Danny_Granger.jpg/revision/latest?cb=20131018180555",
  "dell-curry":
    "https://cdn.nba.com/teams/legacy/www.nba.com/hornets/sites/hornets/files/curry_10.jpg",
  "demarcus-cousins-kings":
    "https://fivethirtyeight.com/wp-content/uploads/2016/01/gettyimages-506803452.jpg",
  "dennis-scott":
    "https://a57.foxsports.com/statics.foxsports.com/www.foxsports.com/content/uploads/2020/02/1280/1280/2767b86a-121313-fsf-nba-magic-dennis-scott-PI.jpg?ve=1&tl=1",
  "dennis-johnson":
    "https://www.sportscasting.com/wp-content/uploads/2022/09/Dennis-Johnson.jpg",
  "deandre-jordan":
    "https://www.usatoday.com/gcdn/-mm-/d623784b05f4053452310ce1a88cae460a9d736d/c=301-178-2113-2595/local/-/media/2015/07/08/USATODAY/USATODAY/635719576544244668-USP-NBA-Playoffs-Los-Angeles-Clippers-at-Houston.jpg",
  "derek-fisher":
    "https://www.ocregister.com/wp-content/uploads/migration/kz2/kz2fjn-kz2fneraptorsmarfisher.jpg?w=535",
  "dave-debusschere-knicks":
    "https://nypost.com/wp-content/uploads/sites/2/2021/12/dave-debusschere.jpg?quality=75&strip=all&w=1024",
  "demarre-carroll":
    "https://www.azcentral.com/gcdn/-mm-/db6444a6459f7df93857db300d6c1b54988d3669/c=277-0-1859-2109/local/-/media/2015/07/01/Phoenix/Phoenix/635713531430203704-carroll-raptors.jpg",
  "dejounte-murray-spurs":
    "https://s.hdnux.com/photos/01/07/35/11/18731584/4/ratio16x9_1920.jpg",
  "devin-harris":
    "https://www.si.com/.image/t_share/MTY4MjYxMTg4MjAzNjUyMjYx/devin-harriscolumnjpg.jpg",
  "chris-andersen":
    "https://www.usatoday.com/gcdn/media/USATODAY/USATODAY/2013/05/31/1370038951000-birdmansuspension-1305311824_3_4.jpg?width=660&height=876&fit=crop&format=pjpg&auto=webp",
  "hedo-turkoglu":
    "https://cdn.nba.com/teams/legacy/www.nba.com/magic/sites/magic/files/legacy/photos/turk7_700_040313.jpg",
  "harrison-barnes-warriors":
    "https://i.ebayimg.com/images/g/UPEAAOSwm8VUr9T3/s-l1200.jpg",
  "harrison-barnes-kings":
    "https://library.sportingnews.com/styles/twitter_card_120x120/s3/2022-01/harrison-barnes_1weahhq1m01u1bzey93o9u8iy.jpg?itok=bFvT1XMs",
  "hersey-hawkins":
    "https://i.pinimg.com/474x/8e/dc/1c/8edc1cdd60a08d59d96c083bc0f4e35f.jpg",
  "donovan-mitchell":
    "https://heavy.com/wp-content/uploads/2019/01/donovanmitchelljazz-e1548262534388.jpg?quality=65&strip=all",
  "domantas-sabonis":
    "https://static01.nyt.com/athletic/uploads/wp/2024/01/28193550/GettyImages-1961733651-e1706488587580.jpg",
  "dolph-schayes-nationals":
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQNmbaE9VnU7bo4zRAfQNuXYO5eXcjMXjcnRg&s",
  "doc-rivers":
    "https://cloudfront-us-east-1.images.arcpublishing.com/ajc/WXZNU4GI65N76A3KNRA6YRKOHY.jpg",
  "doug-christie":
    "https://cdn.nba.com/teams/legacy/www.nba.com/kings/sites/kings/files/gettyimages-72572100.jpg",
  "dirk-nowitzki":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/DirkNowitzki.jpg/250px-DirkNowitzki.jpg",
  "drew-gooden":
    "https://i.namu.wiki/i/ZW3gL9hcjbOwkFkjjhCtkzA-BGRT8Vp_3OdKrV5-UMwyHWQbJK-2yLbX8r6YZwyYfr5B_jJHQFPfdtKxOkYeHQ.webp",
  "tracy-mcgrady-raptors":
    "https://library.sportingnews.com/styles/twitter_card_120x120/s3/2022-01/tracy-mcgrady-raptors-nbae-gettyimages_1meed57to9r3u1ccn3bzrz2i3n.jpg?itok=ZAmhluC9",
  "tracy-mcgrady-magic":
    "https://minutemedia-ressh.cloudinary.com/image/upload/v1694362739/shape/cover/sport/b8054764aa2a084b84b074543a6962fc573ce351b6839c1a0194511a19e2b2c1.jpg",
  "trevor-ariza":
    "https://i.redd.it/maaok4xfv1fb1.jpg",
  "trevor-ariza-rockets":
    "https://cdn.abcotvs.com/dip/images/2960401_011718-kabc-ap-rockets-trevor-ariza-img.jpg",
  "trevor-ariza-wizards":
    "https://ca-times.brightspotcdn.com/dims4/default/6f84a44/2147483647/strip/true/crop/1200x700+0+0/resize/1200x700!/quality/75/?url=https%3A%2F%2Fcalifornia-times-brightspot.s3.amazonaws.com%2F86%2F08%2F8dcf1075118ad71dbe8e461b5169%2Fla-sp-trevor-ariza-20140427",
  "taj-gibson":
    "https://imengine.public.prod.pdh.navigacloud.com/?uuid=3C1EA146-4C38-4FF5-8B6A-14119CEAED69&type=preview&function=cover&height=609&width=800",
  "tim-duncan":
    "https://lh4.googleusercontent.com/proxy/9grgcOgfb2fRXziFVmY2OpRZTvxOlD90mJF27Hc-8EM_DXr7hVpFMqY_cKMOBbEssodvCsCxWGNjUVfhMMEWeRrRjAuqTQe5mZ-Xw9rSFHQJhSqr_BwvT67FM0nGS-C2UgfqlC5cwK81jqCPo3ghmvzGkIp1Z4I",
  "tacko-fall":
    "https://nypost.com/wp-content/uploads/sites/2/2019/10/tacko-fall-2-1.jpg?quality=75&strip=all&w=1200",
  "derrick-white-spurs":
    "https://s.hdnux.com/photos/77/54/53/16698080/4/rawImage.jpg",
  "dwight-howard":
    "https://cdn.bleacherreport.net/images_root/slides/photos/000/709/700/108926554_original.jpg?1297284921",
  "draymond-green":
    "https://cdn.nba.com/manage/2021/12/draymondgreen-6-784x441.jpg",
  "eddie-jones":
    "https://lakersnation.com/wp-content/uploads/2018/04/Eddie-Jones.jpg",
  "elton-brand":
    "https://i.namu.wiki/i/wPs7FoGmLVkEnlKXlF45-_NoW60tp2BXkQh8taG0ScLt6BO9GOrzfdOJNHzS1HYPkYMzwl-cnRaPF0Nu7iAYLQ.webp",
  "elgin-baylor":
    "https://people.com/thmb/A985skBp-7CoPESTJY01mMG8XBo=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():focal(750x379:752x381)/elgin-baylor-1-2000-9afb8cf311fb480fbbe2b12f31a66bf5.jpg",
  "emeka-okafor":
    "https://i.ebayimg.com/images/g/gz0AAOSwrQlhRmyT/s-l1200.jpg",
  "eric-gordon":
    "https://rocketswire.usatoday.com/gcdn/authoring/images/smg/2025/01/06/SROC/77498702007-29-1826.jpeg?width=660&height=496&fit=crop&format=pjpg&auto=webp",
  "eric-snow-76ers":
    "https://s.yimg.com/ny/api/res/1.2/WgC2pkRq.Rx0vD_kOOvxCw--/YXBwaWQ9aGlnaGxhbmRlcjt3PTY0MDtoPTQ1MjtjZj13ZWJw/https://media.zenfs.com/en/sixers_wire_usa_today_sports_articles_847/57e0c19087a2a6d2d0daca524aed5766",
  "elvin-hayes-bullets":
    "https://pbs.twimg.com/media/FCGS7GHXMAkXdft.jpg",
  "fred-van-vleet-raptors":
    "https://cdn.nba.com/manage/2023/04/GettyImages-1479147415-scaled.jpg",
  "goran-dragic-heat":
    "https://heatnation.com/wp-content/uploads/2018/12/Dragic-Dribble-1024x683.jpg",
  "goran-dragic-suns":
    "https://cdn.arizonasports.com/arizonasports/wp-content/uploads/2023/12/GettyImages-463366741-e1703955631379.jpg",
  "gordon-hayward-celtics":
    "https://cdn.nba.com/manage/2020/10/gordon-hayward-iso_0-706x588.jpg",
  "gheorghe-muresan":
    "https://alianta.org/wp-content/uploads/2023/08/Gheorghe-Muresan.png",
  "george-gervin":
    "https://i.ebayimg.com/images/g/EwUAAMXQTgZQ~gIT/s-l400.jpg",
  "gerald-green":
    "https://legacymedia.sportsplatform.io/img/images/photos/003/894/322/hi-res-5a84ffe86c03d4ca6dccba08877ad285_crop_north.jpg?1606753657&w=630&h=420",
  "hassan-whiteside":
    "https://i.redd.it/dvvo1b35nei81.jpg",
  "hal-greer-76ers":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Hal_Greer_1969.jpeg/1280px-Hal_Greer_1969.jpeg",
  "gerald-wallace":
    "https://www.denverpost.com/wp-content/uploads/2016/05/20090227__20090228_C06_SP28BKNPLUGp1.jpg?w=640",
  "gail-goodrich-lakers":
    "https://www.legendsofbasketball.com/wp-content/uploads/2012/02/gail_goodrich.jpg",
  "gus-williams-sonics":
    "https://images.squarespace-cdn.com/content/v1/5f6a2443c6004d000a8d74df/1609965908671-APHXIEN6MXGPJWOVY4O2/Blog+Gus.jpg",
  "gus-williams-super-sonics":
    "https://images.squarespace-cdn.com/content/v1/5f6a2443c6004d000a8d74df/1609965908671-APHXIEN6MXGPJWOVY4O2/Blog+Gus.jpg",
  "grant-hill-pistons":
    "https://assets-cms.thescore.com/uploads/image/file/477604/w640xh480_GettyImages-56383554.jpg?ts=1634656077",
  "glenn-robinson":
    "https://basket-retro.com/wp-content/uploads/2017/01/glenn-robinson-milwaukee-bucks-c-getty.jpg?w=834",
  "marcin-gortat":
    "https://www.washingtonpost.com/wp-apps/imrs.php?src=https://arc-anglerfish-washpost-prod-washpost.s3.amazonaws.com/public/ZUD3D5EBQEI6JHZYSWQYPZGB64&w=1800&h=1800",
  "marcus-smart-celtics":
    "https://cloudfront-us-east-1.images.arcpublishing.com/advancelocal/DEENDNZD5ZGYTNCZEOAZ5SUM5U.jpg",
  "mario-elie-rockets":
    "https://www.clutchfans.net/wp-content/uploads/2022/07/mario-elie-houston-rockets-1.jpg",
  "greg-oden":
    "https://www.usatoday.com/gcdn/presto/2019/12/26/USAT/c2d756f4-98fc-44f7-817b-eb511c7692ed-c03_strip_29.JPG?width=1733&height=2604&fit=crop&format=pjpg&auto=webp",
  "glen-davis":
    "https://s.yimg.com/ny/api/res/1.2/acIHV51ekK_QPLE.7Rw.xw--/YXBwaWQ9aGlnaGxhbmRlcjt3PTcwNTtoPTg5OTtjZj13ZWJw/https://s.yimg.com/os/en_us/News/Yahoo/ept_sports_nba_experts-522435131-1264518778.jpg",
  "glen-rice":
    "https://cdn.nba.com/teams/legacy/www.nba.com/hornets/sites/hornets/files/glen-rice-trophy.jpg",
  "gary-payton":
    "https://seattlerefined.com/resources/media2/original/full/1600/center/80/6a629ef3-d789-4f97-981d-732166f15da4-GettyImages2007517168.jpg",
  "hakeem-olajuwon":
    "https://preview.redd.it/i-asked-gemini-to-argue-why-hakeem-olajuwon-is-the-greatest-v0-098c1wd77ege1.jpeg?width=640&crop=smart&auto=webp&s=ba0ec03f9f7f9a70bdb2f5d9d9737c66f624f8bd",
  "horace-grant":
    "https://images.imagerenderer.com/images/artworkimages/mediumlarge/3/3-horace-grant-rocky-widner.jpg",
  "earl-monroe":
    "https://i.ebayimg.com/images/g/TFAAAOSwPxpg~1Qk/s-l1200.jpg",
  "dominique-wilkins":
    "https://i.namu.wiki/i/_p4r0n_sWZahVy6vsCWg4dK1KcNNx2vBCbSJjwbjB0B365GupjEiopY2yTuP-jncxj9LCC3gJA60vmcfXrebCg.webp",
  "isiah-thomas":
    "https://64.media.tumblr.com/912f8901ce1a8a6690bb587ec529c536/tumblr_inline_ov22dc3uzs1up8ogc_1280.jpg",
  "iman-shumpert-knicks":
    "https://legacymedia.sportsplatform.io/img/images/photos/003/052/400/hi-res-1da9e14ae8266c39560cccdf6d3d5cc3_crop_north.jpg?1410051505&w=630&h=420",
  "isaiah-thomas":
    "https://www.usatoday.com/gcdn/-mm-/bbb7acd158147fd2985120443dd8879162707f25/c=229-32-2658-3271/local/-/media/2017/05/19/USATODAY/USATODAY/636308108765948291-USP-NBA-PLAYOFFS-BOSTON-CELTICS-AT-WASHINGTON-WIZ-90748336.JPG",
  "julius-erving":
    "https://library.sportingnews.com/styles/crop_style_16_9_desktop_webp/s3/2021-08/dr-j_1g92ttzi3oi9e11be3fpqs9k0f.jpeg.webp?itok=tfShklKY",
  "jusuf-nurkic-blazers":
    "https://assets-cms.thescore.com/uploads/image/file/491762/w640xh480_GettyImages-1237653299.jpg?ts=1642113530",
  "james-harden-rockets":
    "https://s.hdnux.com/photos/56/50/16/12223372/6/rawImage.jpg",
  "james-harden-nets":
    "https://cdn.nba.com/teams/legacy/www.nba.com/nets/sites/nets/files/gettyimages-1321319186.jpg",
  "james-harden-clippers":
    "https://basketnews.com/image-455013-crop516x516.jpg",
  "jaylen-brown":
    "https://fieldlevelmedia.com/wp-content/uploads/2025/12/27725863-1024x768.jpg",
  "jason-kidd":
    "https://www.si.com/.image/t_share/MTY4MjU5ODQ5Nzc5MjI2NDk3/image-placeholder-title.jpg",
  "jason-kidd-mavericks":
    "https://www.investors.com/wp-content/uploads/2016/04/KIDD-LS-040616-newscom.jpg",
  "jason-kidd-suns":
    "https://cdn.nba.com/teams/legacy/www.nba.com/suns/sites/suns/files/19-suns-hof-jason-kidd.jpg",
  "jason-williams-kings":
    "https://cdn.nba.com/teams/legacy/www.nba.com/kings/sites/kings/files/jwillhighlights_lrg.jpg",
  "jae-crowder-celtics":
    "https://a2.espncdn.com/combiner/i?img=%2Fphoto%2F2017%2F0313%2Fr190062_1296x729_16%2D9.jpg",
  "jason-richardson":
    "https://s.hdnux.com/photos/42/27/47/9009620/4/1920x0.jpg",
  "j-r-smith":
    "https://content.wkyc.com/photo/2015/06/12/635697111403072209-USATSI-8603838_32914_ver1.0.jpg",
  "j-r-smith-knicks":
    "https://www.usatoday.com/gcdn/-mm-/e17224c897a660ddd92b61954bb53d6c990f2048/c=532-216-2050-2235/local/-/media/USATODAY/test/2013/09/06/1378492008000-USATSI-7252175.jpg",
  "j-j-redick":
    "https://www.usatoday.com/gcdn/media/USATODAY/gameon/2012/11/19/usp-nba_-orlando-magic-at-minnesota-timberwolves-16_9.jpg",
  "j-j-redick-clippers":
    "https://ca-times.brightspotcdn.com/dims4/default/f511206/2147483647/strip/true/crop/1200x700+0+0/resize/1200x700!/quality/75/?url=https%3A%2F%2Fcalifornia-times-brightspot.s3.amazonaws.com%2Fe1%2Fb3%2F2cd38a82d7626dca36db45ff12bf%2Fla-sp-sn-jj-redick-donald-sterling-20140504-001",
  "jimmy-butler":
    "https://hips.hearstapps.com/hmg-prod/images/jimmy-butler-of-the-miami-heat-reacts-during-the-fourth-news-photo-1682620143.jpg?crop=0.670xw:1.00xh;0.185xw,0&resize=1200:*",
  "kareem-abdul-jabbar":
    "https://pbs.twimg.com/media/FBmMlNuWUAMFF-T.jpg",
  "karl-malone":
    "https://cdn.britannica.com/38/256938-050-D1B6AF47/Karl-Malone-NBA-Utah-Jazz-basketball-player.jpg",
  "karl-anthony-towns-wolves":
    "https://cdn.nba.com/manage/2022/06/GettyImages-1239676561-scaled-e1656625510152.jpg",
  "karl-anthony-towns-timberwolves":
    "https://cdn.nba.com/manage/2022/06/GettyImages-1239676561-scaled-e1656625510152.jpg",
  "keith-van-horn":
    "https://netswire.usatoday.com/gcdn/authoring/images/smg/2024/12/28/SNET/77289263007-9-8376.jpeg?width=1200&disable=upscale&format=pjpg&auto=webp",
  "kevin-johnson":
    "https://images.imagerenderer.com/images/artworkimages/mediumlarge/3/3-kevin-johnson-rocky-widner.jpg",
  "kevin-martin":
    "https://s.yimg.com/ny/api/res/1.2/7NsS71Nx96i_ltL8TbC2yg--/YXBwaWQ9aGlnaGxhbmRlcjt3PTY0MDtoPTQ4MjtjZj13ZWJw/https://media.zenfs.com/en/homerun/feed_manager_auto_publish_494/197d6958cd3f878c5c8c518215217012",
  "kiki-vandeweghe-nuggets":
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcROk6lyU--D0x43fFDTjQ4B38VyBahJhSqCgg&s",
  "paul-millsap":
    "https://a57.foxsports.com/statics.foxsports.com/www.foxsports.com/content/uploads/2020/03/1280/1280/9011189-paul-millsap-nba-portland-trail-blazers-atlanta-hawks.jpg?ve=1&tl=1",
  "paul-millsap-jazz":
    "https://sports.cbsimg.net/images/nba/photogallery/millsap.jpg",
  "john-stockton":
    "https://static.wikia.nocookie.net/nba/images/9/99/John_Stockton.jpg/revision/latest?cb=20110427165243",
  "john-starks":
    "https://images.imagerenderer.com/images/artworkimages/mediumlarge/3/john-starks-andrew-d-bernstein.jpg",
  "joe-johnson":
    "https://i.redd.it/tgqn26s5m1tb1.jpg",
  "joe-dumars":
    "https://images.imagerenderer.com/images/artworkimages/mediumlarge/3/1-joe-dumars-rocky-widner.jpg",
  "jeff-teague":
    "https://ugamiracle.wordpress.com/wp-content/uploads/2015/01/jeff-teague.jpg",
  "jeff-hornacek":
    "https://www.legendsofbasketball.com/wp-content/uploads/2012/02/hornacek_display_image.jpg",
  "george-mikan":
    "https://cdn.britannica.com/25/61925-050-82F1265F/George-Mikan.jpg",
  "joakim-noah":
    "https://imengine.public.prod.pdh.navigacloud.com/?uuid=5CC10E8D-80D5-4458-AB22-18E690FBBB8A&type=preview&function=cover&height=609&width=800",
  "julius-erving-nets":
    "https://cdn.nba.com/manage/2020/10/julius-erving-nets-392x588.jpg",
  "jerry-west":
    "https://substackcdn.com/image/fetch/$s_!qTIb!,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F8c741afd-26ed-4064-b63a-26e15ab21a9b_1200x675.jpeg",
  "jerry-stackhouse":
    "https://legacymedia.sportsplatform.io/images_root/slides/photos/000/460/756/71199326_original.jpg?1287806899",
  "jermaine-o-neal":
    "https://i.pinimg.com/474x/98/2b/e1/982be1309c31e86758ad2fc37d3c2580.jpg",
  "jeremy-lin":
    "https://lh3.googleusercontent.com/proxy/CtGYIgM_bc3aqlUAC0luMAk1UtZgjKjfUSJQFJuqB3iFIMSzBZh31e9xd6TAT0Ru6lO2iaIYhHLaBNPCGPspHlp1IDanGCR7mdsFbBJhmuCmOyEYYX3gUfGF2Lba36E4y6Bf",
  "jack-sikma-supersonics":
    "https://assets-cms.thescore.com/uploads/image/file/347054/w640xh480_GettyImages-496866932.jpg?ts=1554569736",
  "jalen-rose":
    "https://cdn.nba.com/teams/legacy/www.nba.com/pacers/sites/pacers/files/506131_10_0.jpg",
  "john-wall":
    "https://upload.wikimedia.org/wikipedia/commons/e/ef/Wall2wizz.jpg",
  "jose-calderon-raptors":
    "https://www.usatoday.com/gcdn/media/USATODAY/USATODAY/2013/02/01/usp-nba_-los-angeles-lakers-at-toronto-raptors-3_4.jpg",
  "jrue-holiday-bucks":
    "https://cdn.nba.com/manage/2023/02/jrue-holiday-looks-iso.jpg",
  "jrue-holiday-celtics":
    "https://a.espncdn.com/photo/2024/0326/r1310256_1296x729_16-9.jpg",
  "james-worthy":
    "https://www.legendsofbasketball.com/wp-content/uploads/2012/02/566140-james_worthy_large.jpg",
  "josh-howard":
    "https://imageio.forbes.com/specials-images/imageserve/577732986/0x0.jpg?format=jpg&height=900&width=1600&fit=bounds",
  "kawhi-leonard":
    "https://www.uticaod.com/gcdn/authoring/2019/06/13/NOBD/ghows-NY-b55ce3d7-0e3c-4aa1-a1ea-a6c5cb5c94c2-1f669383.jpeg?width=1200&disable=upscale&format=pjpg&auto=webp",
  "kawhi-leonard-spurs":
    "https://cdn.nba.com/manage/2020/10/kawhi-leonard-runs-iso-mavs-1-784x523.jpg",
  "kawhi-leonard-raptors":
    "https://www.uticaod.com/gcdn/authoring/2019/06/13/NOBD/ghows-NY-b55ce3d7-0e3c-4aa1-a1ea-a6c5cb5c94c2-1f669383.jpeg?width=1200&disable=upscale&format=pjpg&auto=webp",
  "kobe-bryant":
    "https://cdn.artphotolimited.com/images/67ceea65865e9b3b9ef7de2b/300x300/kobe-bryant-2001-nba-finals.jpg",
  "kevin-durant":
    "https://static01.nyt.com/images/2017/04/07/sports/07durant-web1/07durant-web1-articleLarge.jpg?quality=75&auto=webp&disable=upscale",
  "kevin-love":
    "https://upload.wikimedia.org/wikipedia/commons/8/81/Kevin_Love_2.jpg",
  "kevin-love-timberwolves":
    "https://upload.wikimedia.org/wikipedia/commons/8/81/Kevin_Love_2.jpg",
  "kevin-love-cavs":
    "https://legacymedia.sportsplatform.io/img/images/photos/003/376/297/hi-res-81a724c20c6dde3f6617649ef591bd46_crop_north.jpg?1430177991&w=630&h=420",
  "kyrie-irving-celtics":
    "https://imageio.forbes.com/specials-images/dam/imageserve/1081689926/960x0.jpg?height=464&width=711&fit=bounds",
  "khris-middleton-bucks":
    "https://legacymedia.sportsplatform.io/image/upload/x_0,y_162,w_1800,h_1195,c_crop/v1733413087/gz9weasipxfilgyr6uke.jpg",
  "kerry-kittles":
    "https://slamonline.com/wp-content/uploads/2016/05/Kittles-for-Online.jpg",
  "luis-scola":
    "https://basquetplus.com/sites/default/files/main/articles/LuisScola-HoustonRockets.jpg",
  "lonzo-ball-pelicans":
    "https://imageio.forbes.com/specials-images/imageserve/1211816020/0x0.jpg?format=jpg&height=900&width=1600&fit=bounds",
  "kyrie-irving":
    "https://www.usatoday.com/gcdn/-mm-/daafdabb5e49ae55569e2dbfe59cf6ee99818eef/c=87-0-2373-3048/local/-/media/2017/05/24/USATODAY/USATODAY/636311815863708051-USP-NBA-PLAYOFFS-BOSTON-CELTICS-AT-CLEVELAND-CAVA-91150919-1-.JPG?width=660&height=881&fit=crop&format=pjpg&auto=webp",
  "kyrie-irving-cavs":
    "https://www.usatoday.com/gcdn/-mm-/daafdabb5e49ae55569e2dbfe59cf6ee99818eef/c=87-0-2373-3048/local/-/media/2017/05/24/USATODAY/USATODAY/636311815863708051-USP-NBA-PLAYOFFS-BOSTON-CELTICS-AT-CLEVELAND-CAVA-91150919-1-.JPG?width=660&height=881&fit=crop&format=pjpg&auto=webp",
  "kyrie-irving-nets":
    "https://people.com/thmb/KIq66x98pdTEm9lRcUnrbbjAL-E=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():focal(839x179:841x181)/Kyrie-Irving-10475018eea8497c97b0b9b133128f0d.jpg",
  "kyrie-irving-mavs":
    "https://live-production.wcms.abc-cdn.net.au/56f684ab95740e22d77e1bfb3281c6ad?impolicy=wcms_crop_resize&cropH=3139&cropW=3139&xPos=780&yPos=0&width=862&height=862",
  "kristaps-porzingis-celtics":
    "https://gsp-image-cdn.wmsports.io/cms/prod/bleacher-report/getty_images/2213067854_large_cropped_0.jpg",
  "kyle-korver":
    "https://www.usatoday.com/gcdn/media/USATODAY/USATODAY/2012/11/07/usp-nba_-indiana-pacers-at-atlanta-hawks-16_9.jpg",
  "kyle-korver-bulls":
    "https://cdnph.upi.com/pv/upi/ceb9e1d7702f5fda6e9c7aed2b47f670/NBA-EASTERN-CONFERENCE-QUARTERFINALS.jpg",
  "kyle-lowry-heat":
    "https://www.sun-sentinel.com/wp-content/uploads/2024/01/Lowry.jpg?w=1800&resize=1800,1800",
  "kyle-lowry-raptors":
    "https://s.yimg.com/ny/api/res/1.2/XvdnZB1XUb8czzqtVjGTSA--/YXBwaWQ9aGlnaGxhbmRlcjt3PTY0MDtoPTQyNztjZj13ZWJw/https://media-mbst-pub-ue1.s3.amazonaws.com/creatr-images/2020-01/0a9101e0-3025-11ea-b93f-b4e5d0d33d44",
  "alonzo-mourning-hornets":
    "https://cdn.nba.com/teams/legacy/www.nba.com/hornets/sites/hornets/files/181026_mourning_08.jpg",
  "lamarcus-aldridge":
    "https://www.usatoday.com/gcdn/-mm-/cc18c14920ff4d366d49560a7f4acafbc28884e2/c=85-81-1484-1947/local/-/media/2015/07/04/USATODAY/USATODAY/635716344825258869-USP-NBA-PLAYOFFS-PORTLAND-TRAIL-BLAZERS-AT-MEMPHI-72530096.JPG",
  "lamarcus-aldridge-spurs":
    "https://i.insider.com/59e522e8d4e920b75c8b53bf?width=800&format=jpeg&auto=webp",
  "leandro-barbosa-suns":
    "https://legacymedia.sportsplatform.io/img/images/photos/003/023/619/hi-res-23d2497199edf6c05cda42ad26be70d3_crop_north.jpg?1408388747&w=630&h=420",
  "jamal-crawford":
    "https://a2.espncdn.com/combiner/i?img=%2Fphoto%2F2014%2F0412%2Fla_g_jamal%2Dcrawford_mb_1296x729.jpg",
  "lebron-james":
    "https://videos.usatoday.net/Brightcove2/29906170001/2015/06/29906170001_4282564439001_USATSI-8601943.jpg?pubId=29906170001",
  "larry-bird":
    "https://www.usatoday.com/gcdn/-mm-/6d4245ebf464808df4dc3cdaddd9036c915be31f/c=0-300-3139-4486/local/-/media/2016/12/07/USATODAY/USATODAY/636167048457676560-XXX-LARRY-BIRD-PUTS-UP-A-JUMPSHOT-1706669AB-DNA007-20214831.JPG?width=458&height=610&fit=crop&format=pjpg&auto=webp",
  "lamar-odom":
    "https://cdn.bleacherreport.net/images_root/slides/photos/000/669/536/80849705_original.jpg?1296086977",
  "lance-stephenson":
    "https://legacymedia.sportsplatform.io/img/images/photos/003/669/525/hi-res-5e49411a422a7b235b38e280e2d55702_crop_north.jpg?1492116957&w=630&h=420",
  "larry-johnson":
    "https://cdn.nba.com/teams/legacy/www.nba.com/hornets/sites/hornets/files/johnson_24.jpg",
  "larry-johnson-knicks":
    "https://knickaholic.wordpress.com/wp-content/uploads/2012/03/larryjohnson.jpg",
  "larry-nance-cavs":
    "https://www.legendsofbasketball.com/wp-content/uploads/2012/02/larry_nance-e1328901338978.jpg",
  "luka-doncic":
    "https://media.about.nike.com/img/c287f478-579c-4c31-a5da-3a92411694e9/luka-doncic-enlarge2-2.jpg?m=eyJlZGl0cyI6eyJqcGVnIjp7InF1YWxpdHkiOjEwMH0sIndlYnAiOnsicXVhbGl0eSI6MTAwfSwiZXh0cmFjdCI6eyJsZWZ0Ijo3OTQsInRvcCI6MTAsIndpZHRoIjoxMjc1LCJoZWlnaHQiOjIxMjN9LCJyZXNpemUiOnsid2lkdGgiOjM4NDB9fX0%3D&s=383fe9bab9113f62527527c9c79a8719d45edbdf7d0213113a9373d21d927848",
  "luka-doncic-mavs":
    "https://www.backsportspage.com/wp-content/uploads/2022/04/1231385418.0.jpg",
  "luol-deng":
    "https://s.yimg.com/ny/api/res/1.2/GEAryxjoxksW27QRWzM0Zg--/YXBwaWQ9aGlnaGxhbmRlcjt3PTQyMDtoPTEyMTA7Y2Y9d2VicA--/https://s.yimg.com/os/en_US/Sports/USA_Today/20130422_ajl_aw8_068-c6ede438b04fba0c579c583e4f962544",
  "lou-williams":
    "https://www.si.com/.image/t_share/MTY4MDA3NTMwNjUwNzQwMDk2/lou-williams-clippers-sixth-man-leadjpg.jpg",
  "lou-williams-hawks":
    "https://upload.wikimedia.org/wikipedia/commons/a/ae/Lou_Williams_%2851636058937%29.jpg",
  "magic-johnson":
    "https://cdn.artphotolimited.com/images/65802cc8bd40b870df716a6a/1000x1000/magic-johnson-leads-the-game-1992.jpg",
  "michael-redd":
    "https://wisconsintechnologycouncil.com/wp-content/uploads/2021/09/redd_crop_north-scaled.jpeg",
  "monta-ellis":
    "https://s.yimg.com/ny/api/res/1.2/_uSNoWkWMSCIpH08OaTJkg--/YXBwaWQ9aGlnaGxhbmRlcjt3PTY0MDtoPTgwODtjZj13ZWJw/https://s.yimg.com/os/en_us/News/Yahoo/ept_sports_nba_experts-946391445-1258491265.jpg",
  "mahmoud-abdul-rauf":
    "https://nypost.com/wp-content/uploads/sites/2/2023/02/GettyImages-1207652869-1.jpg",
  "mark-eaton":
    "https://people.com/thmb/L7Cp7PQ7YkSnqf4dt8vbUJalVHU=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():focal(678x19:680x21)/Mark-Eaton--0a4a4552eafe43e39dd975d1648d2329.jpg",
  "jamal-mashburn":
    "https://hoopshallny.org/wp-content/uploads/2023/08/Jamal-Mashburn.jpg",
  "jamal-mashburn-heat":
    "https://www.sun-sentinel.com/wp-content/uploads/migration/2022/09/20/QJSW7EM3R5AI3HH5R7NLXL4DAY.jpg",
  "jamal-wilkes":
    "https://static.wikia.nocookie.net/nba/images/3/30/Jamaal_Wilkes.jpg/revision/latest?cb=20260223020926",
  "jamal-tinsley":
    "https://www.sportsnet.ca/wp-content/uploads/2009/11/tinsley_jamaal_big.jpg",
  "josh-smith":
    "https://i.redd.it/what-happened-to-josh-smith-v0-jtmtrfzismqd1.jpg?width=1346&format=pjpg&auto=webp&s=45d989dea0ca5546df6508ff36729658a061d339",
  "jay-williams":
    "https://www.the-sun.com/wp-content/uploads/sites/6/2023/09/user-expressly-acknowledges-agrees-downloading-846224676.jpg?strip=all&w=636",
  "jameer-nelson":
    "https://static01.nyt.com/athletic/uploads/wp/2019/09/03171747/GettyImages-1009199212-e1567545493143.jpg",
  "mark-aguirre":
    "https://cdn.nba.com/teams/legacy/www.mavs.com/wp-content/uploads/2020/05/GettyImages-114076423.jpg",
  "mark-jackson":
    "https://i.pinimg.com/474x/76/0b/c4/760bc48967e7b36d68aff1774b712cc9.jpg",
  "matt-harpring-jazz":
    "https://cloudfront-us-east-1.images.arcpublishing.com/deseretnews/WBQ6KOZUFTLWCFEEM2C3IDLGU4.jpg",
  "matt-barnes-clippers":
    "https://s.yimg.com/ny/api/res/1.2/107p1YGdxV4p8ObPUPNOTA--/YXBwaWQ9aGlnaGxhbmRlcjt3PTY0MDtoPTQ4MjtjZj13ZWJw/https://media.zenfs.com/en/blogs/sptusnbaexperts/Matt-Barnes-is-staying-in-L.A.-Joe-Robbins-Getty-Images.jpg",
  "marcus-camby":
    "https://cdn.nba.com/teams/legacy/www.nba.com/nuggets/sites/nuggets/files/cambyheader.jpg",
  "marcus-camby-knicks":
    "https://talksport.com/wp-content/uploads/2025/05/crop-3240834.jpg?strip=all&w=960",
  "marc-gasol":
    "https://legacymedia.sportsplatform.io/img/images/photos/003/169/247/hi-res-65448a15ec276e9c5dc852fc6125fb21_crop_north.jpg?1416874909&w=630&h=420",
  "manute-bol":
    "https://s.hdnux.com/photos/65/02/217260/4/1920x0.jpg",
  "manu-ginobili":
    "https://cdn.nba.com/manage/2022/09/ginobili-emotion.jpg",
  "maurice-cheeks":
    "https://cdn.nba.com/teams/uploads/sites/1610612755/2023/01/cheeks2.png",
  "maurice-lucas-blazers":
    "https://ml20.org/wp-content/uploads/2022/02/86ac4557e8770496.jpg",
  "wesley-matthews-blazers":
    "https://i.namu.wiki/i/OztZCplV6Tc1M5KxJZAITPc4--8NQVfrEfJCbfMEgve6zqfSLQiPL1gk4huvXw2HTuTcGMVZKDfDqHn1NkzbhQ.webp",
  "victor-oladipo-pacers":
    "https://cdn.nba.com/manage/2020/02/20200229_OLADIPO_LOOK-scaled.jpg",
  "willis-reed":
    "https://nypost.com/wp-content/uploads/sites/2/2023/03/NYPICHPDPICT000008577101.jpg",
  "wilson-chandler-knicks":
    "https://cdn.nba.com/teams/legacy/www.nba.com/knicks/sites/knicks/files/legacy/photos/wilsonsophomore09.jpg",
  "clint-capela":
    "https://imageio.forbes.com/specials-images/dam/imageserve/955500076/0x0.jpg?format=jpg&height=900&width=1600&fit=bounds",
  "kenny-smith":
    "https://images.wsj.net/im-771297?width=1280&size=0.654",
  "kendrick-perkins":
    "https://www.the-sun.com/wp-content/uploads/sites/6/2024/10/user-expressly-acknowledges-agrees-downloading-918027750.jpg?strip=all&w=640",
  "michael-cooper":
    "https://andscape.com/wp-content/uploads/2024/10/GettyImages-1080006200.jpg?w=683",
  "michael-finley":
    "https://images.imagerenderer.com/images/artworkimages/mediumlarge/3/michael-finley-glenn-james.jpg",
  "michael-jordan":
    "https://static.wikia.nocookie.net/nbastreet/images/9/97/FDB1BF72-3F75-446F-B4F2-000331AE638B.jpeg/revision/latest?cb=20210419024456",
  "michael-jordan-wizards":
    "https://img.asmedia.epimg.net/resizer/v2/ERRBERZ6OFKWPEF6Y4Y6RCTZOA.jpg?auth=038c563986d307c8bc8e506f16b84e6599d6d18ccc41c46e16c2e072394872b1&width=644&height=362&focal=602%2C85",
  "michael-beasley-heat":
    "https://nbcsports.brightspotcdn.com/dims4/default/45d0757/2147483647/strip/false/crop/2518x3147+0+0/resize/1189x1486!/quality/90/?url=https%3A%2F%2Fnbc-sports-production-nbc-sports.s3.us-east-1.amazonaws.com%2Fbrightspot%2F72%2Fb1%2F913a26f86a59b503749ea08e7099%2Fcd0ymzcznguwzdbhnduynddiytjhm2yyzthlmtjjotqwyyznpwrjy2uwmjbimwqwnmqwndg3yzhhnjixzmfhzdeymmjk.jpeg",
  "mehmet-okur":
    "https://archive.sltrib.com/images/2012/1108/jazz_okur_110912~0.jpg",
  "mike-miller-grizzlies":
    "https://static.foxnews.com/foxnews.com/content/uploads/2018/09/Grizzlies-Miller-Time-Basketball-1.jpg",
  "mike-bibby":
    "https://www.legendsofbasketball.com/wp-content/uploads/2020/11/mike-bibby.jpg",
  "mike-bibby-hawks":
    "https://www.boston.com/wp-content/uploads/2011/04/bibbypre-thumb-275x400-28584-thumb-275x400-28585.jpg",
  "mike-conley":
    "https://legacymedia.sportsplatform.io/img/images/photos/003/647/141/ee95d67ca7a8afeca79d93afec516857_crop_north.jpg?1481914896&w=630&h=420",
  "mo-williams":
    "https://content.wkyc.com/photo/2015/07/10/635721301186971570-109082014_1262224_ver1.0.jpg",
  "mookie-blaylock-hawks":
    "https://cdn.nba.com/teams/legacy/www.nba.com/hawks/sites/hawks/files/legacy/photos/mookie3.jpg",
  "morris-peterson-hornets":
    "https://alchetron.com/cdn/morris-peterson-52d1a9cf-5181-483b-84a7-3e50120490d-resize-750.jpeg",
  "mitch-richmond":
    "https://cdn.nba.com/teams/legacy/www.nba.com/warriors/sites/warriors/files/legacy/photos/Richmond_Rock.jpg",
  "nene":
    "https://legacymedia.sportsplatform.io/img/images/photos/003/190/007/hi-res-34a630b24c5f16f8fba21af6c3aca8a4_crop_north.jpg?1418178310=&w=3800&h=2000",
  "nicolas-batum-blazers":
    "https://platform.blazersedge.com/wp-content/uploads/sites/34/chorus/uploads/chorus_asset/file/13347065/96329185.jpg.jpg?quality=90&strip=all&crop=16.733333333333,0,66.533333333333,100",
  "norm-nixon-lakers":
    "https://www.legendsofbasketball.com/wp-content/uploads/2012/02/Norm_Nixon_display_image.jpg",
  "norman-powell-raptors":
    "https://cdn.nba.com/teams/legacy/www.nba.com/raptors/sites/raptors/files/powell-756-1_2.jpg",
  "nate-robinson":
    "https://images.nymag.com/images/2/daily/2010/01/20100119_naterobinson_250x375.jpg",
  "moses-malone":
    "https://media.gq.com/photos/55f7333e2de2e54e38605818/1:1/w_1326,h_1326,c_limit/moses-malone-sixers.jpg",
  "muggsy-bogues":
    "https://m.media-amazon.com/images/M/MV5BMWQzY2IzNzAtZWZkNS00YWQ0LTlmZmQtZmUyOWZhYWEwNzEwXkEyXkFqcGc@._V1_.jpg",
  "vince-carter-raptors":
    "https://pbs.twimg.com/media/ENep4WvUcAAXyQo.jpg",
  "vince-carter-nets":
    "https://nypost.com/wp-content/uploads/sites/2/2023/12/GettyImages-85737991.jpg",
  "vlade-divac":
    "https://www.usatoday.com/gcdn/-mm-/b994c4db0d3ad6e1dd59bd1cbe0b122ac2f1694c/c=50-69-1108-1480/local/-/media/2015/03/03/USATODAY/USATODAY/635609924377957622-XXX-SUNS-KINGS-1316381.JPG?width=660&height=881&fit=crop&format=pjpg&auto=webp",
  "wilt-chamberlain":
    "https://i.redd.it/r5zobke7ea9e1.jpeg",
  "otis-thorpe":
    "https://alchetron.com/cdn/otis-thorpe-eb87a7c4-ac10-4f52-8ee1-eeebc7a4ffe-resize-750.jpeg",
  "wally-szczerbiak":
    "https://preview.redd.it/timberwolves-in-history-wally-szczerbiak-v0-z00uhwtz8m2f1.jpeg?auto=webp&s=9a5baad8cdd411679646b78ac6a3fa88a768ea03",
  "walt-frazier":
    "https://cdn.britannica.com/07/258007-050-4F67E33A/Basketball-player-Walt-Frazier-dribbles-the-ball-against-the-Baltimore-Bullets-during-an-NBA-basketball-game-1971.jpg",
  "world-b-free-cavs":
    "https://i.pinimg.com/736x/74/7a/1e/747a1e9283c9eecbc546a73ed4315b62.jpg",
  "oscar-robertson":
    "https://external-preview.redd.it/photo-of-the-day-the-big-o-tested-veteran-point-guard-oscar-v0-2fl5SvnfW1U1dIitlWSKsU6kdL0rxSqrcQ2eXvNmkPA.jpg?width=640&crop=smart&auto=webp&s=16b2f8c129b2d02506dbc40c8a621489e7f48f29",
  "o-j-mayo":
    "https://cdn.nba.com/teams/legacy/www.nba.com/grizzlies/sites/grizzlies/files/legacy/main_photo/mayo-081013-jm131-300.jpg",
  "otto-porter-jr":
    "https://s.yimg.com/ny/api/res/1.2/OOz7JtS9E3sokbK8kvJcQA--/YXBwaWQ9aGlnaGxhbmRlcjt3PTY0MDtoPTQzMjtjZj13ZWJw/https://media.zenfs.com/en/homerun/feed_manager_auto_publish_494/8eeb2dfca9d56743d4cd1086273f7813",
  "otis-birdsong-nets":
    "https://www.legendsofbasketball.com/wp-content/uploads/2012/02/Otis-Birdsong.jpg",
  "og-anunoby-raptors":
    "https://legacymedia.sportsplatform.io/image/upload/x_34,y_51,w_1598,h_1063,c_crop/v1703959327/xppmmanzncqroic0fgqk.jpg",
  "pau-gasol":
    "https://static.wikia.nocookie.net/nbasports/images/9/91/San_Antonio_Spurs_v_Los_Angeles_Lakers_Game_0_MoFFLaWuhl.jpg/revision/latest/scale-to-width-down/323?cb=20130705212405",
  "paul-arizin-warriors":
    "https://c8.alamy.com/comp/2F121GP/paul-arizin-played-for-the-philadelphia-warriors-in-the-1950s-and-1960s-and-was-an-early-pioneer-of-the-jump-shot-photo-by-philadelphia-daily-newsmctsipa-usa-2F121GP.jpg",
  "paul-george":
    "https://cdn.nba.com/teams/legacy/www.nba.com/pacers/sites/pacers/files/pgstepsup.jpg",
  "pascal-siakam":
    "https://cdn.nba.com/teams/legacy/www.nba.com/raptors/sites/raptors/files/siakam_0.jpg",
  "pascal-siakam-raptors":
    "https://www.sportsnet.ca/wp-content/uploads/2022/04/Siakam-4-768x432.jpg",
  "patrick-ewing":
    "https://blacknewsandviews.com/wp-content/uploads/2025/02/PatrickEwing-Knicks-SHIB-AP-BNV-scaled.jpg",
  "patrick-ewing-2000-knicks":
    "https://i.redd.it/7olm6u6kndde1.jpeg",
  "rajon-rondo":
    "https://www.usatoday.com/gcdn/-mm-/8050ff333eee51d97bfebc8ab319ad311069159c/c=982-0-2763-2375/local/-/media/2014/12/18/USATODAY/USATODAY/635544622339200143-USP-NBA-BOSTON-CELTICS-AT-ATLANTA-HAWKS-69168926.JPG",
  "rajon-rondo-lakers":
    "https://legacymedia.sportsplatform.io/img/images/photos/003/879/947/hi-res-2e0762a38329e5be139d6b8d8b84aa88_crop_north.jpg?1597334691&w=630&h=420",
  "rick-barry":
    "https://sportscollectorsdigest.com/uploads/MjA0MzY2ODE4MTU0OTE0ODkz/barry-free-throws-getty.jpg?format=auto&optimize=high&width=1440",
  "rik-smits":
    "https://cdn.nba.com/teams/legacy/www.nba.com/pacers/sites/pacers/files/gettyimages-457989006_master.jpg",
  "rip-hamilton":
    "https://www.vintagedetroit.com/wp-content/uploads/2011/02/Rip-Hamilton.jpg",
  "pete-maravich":
    "https://platform.slcdunk.com/wp-content/uploads/sites/145/chorus/uploads/chorus_asset/file/24912240/1094463402.jpg?quality=90&strip=all&crop=0,16.666666666667,100,66.666666666667",
  "penny-hardaway":
    "https://cdn.nba.com/teams/legacy/www.nba.com/magic/sites/magic/files/9_penny-20170112.jpg",
  "peja-stojakovic":
    "https://cdn.nba.com/teams/legacy/www.nba.com/kings/sites/kings/files/9_24.jpg",
  "peja-stojakovic-hornets":
    "https://tomaskaki.wordpress.com/wp-content/uploads/2012/12/peja_stojakovic_hornets-886.jpg?w=224&h=300",
  "reggie-miller":
    "https://www.tuscaloosanews.com/gcdn/authoring/2007/08/09/NTTN/ghows-DA-956c6365-614f-4280-8405-f5e1f84e025e-1569fd9a.jpeg?width=1200&disable=upscale&format=pjpg&auto=webp",
  "robert-parish":
    "https://s.yimg.com/ny/api/res/1.2/882IvYtfStkE8iCZMwl3qw--/YXBwaWQ9aGlnaGxhbmRlcjt3PTY0MDtoPTc4MTtjZj13ZWJw/https://media.zenfs.com/en/celtics_wire_usa_today_sports_articles_699/3c37a5b411ecd07a9130974c2c565823",
  "hasheem-thabeet":
    "https://fanbuzz.com/wp-content/uploads/sites/5/2022/03/Hasheem-Thabeet-Now.png?w=1056",
  "robert-horry":
    "https://oneway77jc.com/cdn/shop/products/ROBERT.jpg?v=1666502059",
  "robert-horry-spurs":
    "https://www.swtimes.com/gcdn/authoring/2015/06/19/NAEN/ghows-TX-0ce72fee-9226-4c51-9b12-ac2d537df8c3-7c87f728.jpeg?width=1200&disable=upscale&format=pjpg&auto=webp",
  "richard-jefferson":
    "https://netswire.usatoday.com/gcdn/authoring/images/smg/2024/12/28/SNET/77289195007-9-8521.jpeg",
  "ronnie-brewer-jazz":
    "https://www.legendsofbasketball.com/wp-content/uploads/2020/11/ronnie-brewer-jr-scaled.jpeg",
  "ron-harper-cavs":
    "https://cdn.nba.com/manage/2025/08/GettyImages-1131445342rh.jpg",
  "rod-strickland-blazers":
    "https://i.pinimg.com/736x/c6/bd/11/c6bd118595ed4f68c49044999271c08b.jpg",
  "rod-strickland-bullets":
    "https://static.wikia.nocookie.net/nba/images/8/8d/Rod_Strickland.jpg/revision/latest?cb=20241021014322",
  "ron-artest-pacers":
    "https://www.indystar.com/gcdn/-mm-/66bcab82c8bc89d9e399c0e441e051250a52c6a0/c=6-0-979-1294/local/-/media/Indianapolis/Indianapolis/2014/07/31/1406812663000-ron-artest.jpg",
  "ron-artest-rockets":
    "https://www.sandiegouniontribune.com/wp-content/uploads/migration/2009/07/08/00000169-0ce2-dbbe-a16f-4ee2c5770000.jpg?w=535",
  "rasheed-wallace-blazers":
    "https://www.si.com/.image/t_share/MTY4MjYxNzQ4MTU1MDMyODUz/rasheed-dudley.jpg",
  "russell-westbrook":
    "https://pbs.twimg.com/media/GxcIsZZXsAAWwst.jpg",
  "ray-allen":
    "https://www.sportsnet.ca/wp-content/uploads/2013/07/allen_ray640.jpg",
  "billy-cunningham-76ers":
    "https://static.wikia.nocookie.net/nba/images/2/26/Billy_Cunningham.jpg/revision/latest?cb=20250424031836",
  "rashard-lewis":
    "https://www.sandiegouniontribune.com/wp-content/uploads/migration/2009/05/21/00000169-0ce2-dbbe-a16f-4ee294730000.jpg?w=535",
  "rashard-lewis-supersonics":
    "https://www.talkbasket.net/wp-content/uploads/2023/09/FqpLFbYXoAI-bhj.webp",
  "ralph-sampson":
    "https://ca-times.brightspotcdn.com/dims4/default/081ceb5/2147483647/strip/true/crop/2400x3598+0+0/resize/1200x1799!/quality/75/?url=https%3A%2F%2Fcalifornia-times-brightspot.s3.amazonaws.com%2Ffd%2F1d%2F94f40646432fb2f69e6a85371d01%2Fgettyimages-52165394.jpg",
  "rudy-gobert":
    "https://www.hoopshype.com/gcdn/authoring/images/smg/2025/04/04/SHHP/82916932007-92-1337492.jpeg",
  "rudy-gay":
    "https://fadeawayworld.net/wp-content/uploads/2025/09/rudy-gay-speaks-to-a-fan-during-a-game-between-the-memphis-grizzlies-and-dallas-mavericks-1536x1075.jpg",
  "serge-ibaka":
    "https://cdn.nba.com/teams/legacy/www.nba.com/thunder/sites/thunder/files/legacy/photos/serge_2_playoffs1011.jpg",
  "sidney-moncrief":
    "https://cdn.nba.com/manage/2021/09/GettyImages-1480479.jpg",
  "spud-webb":
    "https://res.cloudinary.com/hv5nj13jb/image/upload/c_fill,h_300,w_300/7tcfa144h7gxo5xax7be01xzjmar?_a=BACAGSGT",
  "udonis-haslem":
    "https://bornraised305.wordpress.com/wp-content/uploads/2016/04/uhaslem.jpg?w=640",
  "tyronn-lue":
    "https://pbs.twimg.com/media/CHqRR6XUsAACwFF.jpg",
  "vin-baker":
    "https://cdn.nba.com/teams/legacy/www.nba.com/bucks/sites/bucks/files/baker2_0.jpg",
  "ben-wallace":
    "https://nbatimemachine.wordpress.com/wp-content/uploads/2017/01/ben-wallace-net-worth1.jpg",
  "bernard-king":
    "https://i.ytimg.com/vi/ycMJh3fj4QU/maxresdefault.jpg",
  "bob-mcadoo":
    "https://upload.wikimedia.org/wikipedia/commons/9/9f/Mcadoo_1973.jpg",
  "corey-maggette":
    "https://images.squarespace-cdn.com/content/v1/625e7a2d66a71a41f2df7866/1762194554602-QAJQ2ZPS9NGKUS7GFRT6/Corey+Maggette+feature.png",
  "cutino-mobley":
    "https://s.hdnux.com/photos/74/05/52/15751848/8/1920x0.jpg",
  "bradley-beal":
    "https://upload.wikimedia.org/wikipedia/commons/e/eb/Bradley_Beal_Wizards.jpg",
  "brian-scalabrine":
    "https://legacymedia.sportsplatform.io/img/images/photos/003/908/331/hi-res-bf8cd2fcbc846f9cde7b534c9b6ff430_crop_north.jpg?1616540389&w=630&h=420",
  "bill-russell":
    "https://delta.creativecirclecdn.com/quill/original/20231116-115407-65563457d7cc9image.jpg",
  "boris-diaw":
    "https://images2.minutemediacdn.com/image/upload/c_fill,w_1200,ar_1:1,f_auto,q_auto,g_auto/shape/cover/sport/0e88304c79595fae26f8e661ab9d8fb93119fbc2ce798853ad76d3c5e89b8a59.jpg",
  "bill-walton":
    "https://images.imagerenderer.com/images/artworkimages/mediumlarge/3/bill-walton-dick-raphael.jpg",
  "blake-griffin":
    "https://www.rollingstone.com/wp-content/uploads/2018/06/rs-20057-20140415-blakeg-x1800-1397571870.jpg",
  "brandon-jennings":
    "https://www.backsportspage.com/wp-content/uploads/2011/04/brandon_jennings.jpg",
  "brandon-roy":
    "https://static.wikia.nocookie.net/nba/images/5/53/Brandon_Roy.jpg/revision/latest?cb=20110426210630",
  "brandon-roy-timberwolves":
    "https://www.usatoday.com/gcdn/media/USATODAY/USATODAY/2012/12/13/usp-nba_-sacramento-kings-at-minnesota-timberwolve-3_4.jpg",
  "avery-johnson-spurs":
    "https://foxsanantonio.com/resources/media/3c75cae7-6da7-472f-8eba-f04f8cd1ce1a-jumbo1x1_20180223_bhm_avery_johnson.jpg?1589982702695",
  "chris-paul-hornets":
    "https://legacymedia.sportsplatform.io/images_root/slides/photos/000/538/714/106958476_original.jpg?1291243979",
  "chris-paul-clippers":
    "https://gsp-image-cdn.wmsports.io/cms/prod/bleacher-report/getty_images/136109782_large_image.jpg",
  "chris-paul-rockets":
    "https://legacymedia.sportsplatform.io/img/images/photos/003/781/860/hi-res-09b7021b5263bb9c56867b5f592cc0c0_crop_north.jpg?1545432470=&w=3800&h=2000",
  "chris-bosh-raptors":
    "https://s.yimg.com/ny/api/res/1.2/TOA_.ISO02dk2Rf4uym0fg--/YXBwaWQ9aGlnaGxhbmRlcjt3PTY0MDtoPTQyNTtjZj13ZWJw/https://s.yimg.com/os/creatr-uploaded-images/2021-09/268c2920-14a2-11ec-bddf-7cac2f45a5b2",
  "chris-kaman-clippers":
    "https://www.ocregister.com/wp-content/uploads/migration/kpl/kpl9ug-17clipperslrg.jpg?w=535",
  "chris-bosh-heat":
    "https://www.sltrib.com/resizer/v2/6PFJB26LLVG6BHVQ2PI4WAI6TM.jpg?auth=88c739e06dba9e84037ffd655fa03c518f397c994e2ab24c10c2482054d2d8b8&width=1024&quality=88",
  "chris-mullin":
    "https://hoopshallny.org/wp-content/uploads/2023/08/Chris-Mullin.jpg",
  "chris-webber":
    "https://preview.redd.it/how-well-do-you-guys-see-a-prime-chris-webber-doing-in-v0-l2kk3m3vv2xf1.jpeg?width=640&crop=smart&auto=webp&s=5a5b2716a6b1f5db7dca2179333fd4db7077faf7",
  "charles-barkley-76ers":
    "https://cdn.nba.com/teams/uploads/sites/1610612755/2023/01/barkley2.png",
  "charles-barkley-suns":
    "https://cdn.nba.com/teams/legacy/www.nba.com/suns/sites/suns/files/barkley_2.jpg",
  "bob-love-bulls":
    "https://www.sportscasting.com/wp-content/uploads/2024/11/Bob-Love.jpg",
  "anthony-davis":
    "https://www.usatoday.com/gcdn/presto/2019/01/25/USAT/8face4bf-fda9-4585-8fce-19d456e2fe5d-2019-01-24_Anthony_Davis1.jpg?crop=1744,2326,x365,y211",
  "anthony-davis-pelicans":
    "https://www.usatoday.com/gcdn/presto/2019/01/25/USAT/8face4bf-fda9-4585-8fce-19d456e2fe5d-2019-01-24_Anthony_Davis1.jpg?crop=1744,2326,x365,y211",
  "anthony-davis-lakers":
    "https://www.ocregister.com/wp-content/uploads/2023/05/imageedit_12_9055589-16x9-1.jpg?w=1800&resize=1800,1800",
  "antonio-mcdyess":
    "https://i.ytimg.com/vi/-1WzLaN3NQw/sddefault.jpg",
  "artis-gilmore":
    "https://www.legendsofbasketball.com/wp-content/uploads/2012/02/AG.jpg",
  "baron-davis":
    "https://warriorswire.usatoday.com/gcdn/authoring/images/smg/2024/11/14/SWAR/76307665007-33-24745.jpeg",
  "bruce-bowen":
    "https://www.legendsofbasketball.com/wp-content/uploads/2020/11/bruce-bowen.jpg",
  "andrei-kirilenko":
    "https://platform.slcdunk.com/wp-content/uploads/sites/145/chorus/uploads/chorus_asset/file/25182478/78826535.jpg?quality=90&strip=all&crop=0,8.8611111111111,100,66.666666666667",
  "andre-iguodala":
    "https://cdn.bleacherreport.net/images_root/slides/photos/000/628/641/86306010_original.jpg?1294782454",
  "andre-iguodala-warriors":
    "https://static01.nyt.com/images/2016/06/02/sports/02ARATON/02ARATON-superJumbo-v2.jpg",
  "adrian-dantley":
    "https://cdn.nba.com/teams/uploads/sites/1610612762/2023/11/GettyImages-499320108.jpg",
  "alex-english":
    "https://images.imagerenderer.com/images/artworkimages/mediumlarge/2/denver-nuggets-alex-english-andrew-d-bernstein.jpg",
  "rex-chapman-suns":
    "https://i.pinimg.com/736x/d7/da/f8/d7daf831138e1ebd83ae1fc853b251c9.jpg",
  "allan-houston":
    "https://www.backsportspage.com/wp-content/uploads/2017/06/allan_houston.jpg",
  "al-horford-hawks":
    "https://cdn.nba.com/teams/legacy/www.nba.com/hawks/sites/hawks/files/horford-easternconference.jpg",
  "al-horford-celtics":
    "https://platform.celticsblog.com/wp-content/uploads/sites/63/chorus/uploads/chorus_asset/file/24637811/1252622537.jpg?quality=90&strip=all&crop=12.175,0,75.65,100",
  "a-c-green-lakers":
    "https://i.redd.it/f64vi8qk9tgb1.jpg",
  "allen-iverson":
    "https://cdn.nba.com/manage/2022/03/ai3-scaled.jpg",
  "allen-iverson-76ers":
    "https://cdn.nba.com/manage/2022/03/ai3-scaled.jpg",
  "allen-iverson-nuggets":
    "https://www.dailynews.com/wp-content/uploads/migration/2008/200811/NEWS_811049804_AR_0_0.jpg?w=535",
  "carmelo-anthony-nuggets":
    "https://images.imagerenderer.com/images/artworkimages/mediumlarge/3/carmelo-anthony-andrew-d-bernstein.jpg",
  "carmelo-anthony-knicks":
    "https://cdn.bleacherreport.net/images_root/slides/photos/000/748/228/109386852_original.jpg?1298564512",
  "calvin-murphy":
    "https://www.mcall.com/wp-content/uploads/migration/2021/04/03/35YNAXLMUVBIPOX2O322NT7S3Y.jpg?w=535",
  "bryant-reeves":
    "https://fanbuzz.com/wp-content/uploads/sites/5/2020/12/Bryant-Reeves-Now.png",
  "carlos-boozer":
    "https://cdn.nba.com/teams/legacy/www.nba.com/jazz/sites/jazz/files/gettyimages-98852331.jpg",
  "carlos-boozer-bulls":
    "https://a.espncdn.com/combiner/i?img=%2Fphoto%2F2013%2F0710%2Fgrant_g_carlos%2Dboozer_mb_800.jpg",
  "p-j-brown":
    "https://minutemedia-ressh.cloudinary.com/image/upload/v1693491643/shape/cover/sport/928b5be80bb2a4797aed71bf0edd20963f636105e55000f4e79e999064b1d80e.jpg",
  "chauncey-billups":
    "https://news.cgtn.com/news/3355544d356b6a4e306b544d3541444f3359444f31457a6333566d54/img/90771ec99d1e41d691b78f720b733601/90771ec99d1e41d691b78f720b733601.jpg",
  "chauncey-billups-nuggets":
    "https://upload.wikimedia.org/wikipedia/commons/6/65/Chauncey_Billups_Nuggets.jpg?utm_source=commons.wikimedia.org&utm_campaign=index&utm_content=original",
  "dan-issel":
    "https://cdn.nba.com/manage/2020/10/dan-issel-driving.jpg",
  "fat-lever":
    "https://static.wixstatic.com/media/e716ee_05d3709f50514e19882b3fa08fbb8856~mv2.jpg/v1/fill/w_568,h_386,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/e716ee_05d3709f50514e19882b3fa08fbb8856~mv2.jpg",
  "darryl-dawkins":
    "https://i.redd.it/5oi85lhhnpug1.jpeg",
  "clyde-drexler-blazers":
    "https://images.imagerenderer.com/images/artworkimages/mediumlarge/3/clyde-drexler-dale-tait.jpg",
  "clyde-drexler-rockets":
    "https://images.imagerenderer.com/images/artworkimages/mediumlarge/3/7-clyde-drexler-rocky-widner.jpg",
  "shaquille-o-neal":
    "https://preview.redd.it/who-would-you-rather-have-prime-shaq-or-prime-giannis-v0-d0ogt1n4r6pe1.jpg?width=640&crop=smart&auto=webp&s=d72c0c9849e683ce07b4bfbe0ed627556c0247c5",
  "sidney-wicks-blazers":
    "https://media.gettyimages.com/id/494769984/photo/baltimore-md-sidney-wicks-of-the-portland-trail-blazers-looks-to-pass-the-ball-against-the.jpg?s=612x612&w=gi&k=20&c=zgX3_TJjPXlTN6-edflsHwURQ4h-x3ohVdB-ZSJCUgQ=",
  "sam-cassell":
    "https://cdn3.sbnation.com/imported_assets/590084/51824836.jpg.13789.0_display_image.jpg",
  "sam-cassell-bucks":
    "https://static.wikia.nocookie.net/nba-basketball/images/d/da/Sam_Cassell.JPG/revision/latest/scale-to-width-down/263?cb=20161020165934",
  "sam-cassell-clippers":
    "https://www.ocregister.com/wp-content/uploads/migration/kpj/kpjck4-28clipno1large.jpg?w=640",
  "stromile-swift":
    "https://media.gettyimages.com/id/1256951329/photo/washington-dc-stromile-swift-of-the-memphis-grizzlies-handles-the-ball-against-the-washington.jpg?s=612x612&w=gi&k=20&c=4ytq5QcXGhvyTBlqBXBi_9LZSsWhPrLN5md4zyRWuXM=",
  "shawn-marion":
    "https://cdn.nba.com/teams/legacy/www.nba.com/suns/sites/suns/files/shawn_marion_retires_35.jpg",
  "scottie-pippen":
    "https://i.redd.it/x1b00sjpzz7d1.jpeg",
  "latrell-sprewell":
    "https://cdn.nba.com/teams/legacy/www.nba.com/knicks/sites/knicks/files/gettyimages-72527249.jpg",
  "latrell-sprewell-timberwolves":
    "https://static.wikia.nocookie.net/nba/images/a/a3/Latrell_Sprewell.jpg/revision/latest/scale-to-width-down/1200?cb=20210729072246",
  "detlef-schrempf":
    "https://library.sportingnews.com/styles/twitter_card_120x120/s3/2021-08/detlef-schrempf_1w4bb26e9ij2s1iqm4xp8btugg.jpeg?itok=TTc5qR0B",
  "detlef-schrempf-pacers":
    "https://cdn.nba.com/teams/legacy/www.nba.com/pacers/sites/pacers/files/legacy/photos/dschrempf9.jpg",
  "steph-curry":
    "https://compote.slate.com/images/24605cda-82b1-4342-9af9-4b86f684174b.jpg",
  "stephen-jackson":
    "https://s.hdnux.com/photos/44/05/36/9459624/4/rawImage.jpg",
  "stephon-marbury":
    "https://i.pinimg.com/736x/8c/78/c9/8c78c9fd594a89740164aeef98f35994.jpg",
  "tom-gugliotta-timberwolves":
    "https://cdn.nba.com/teams/legacy/www.nba.com/timberwolves/sites/timberwolves/files/gugs-1997.jpg",
  "steve-kerr":
    "https://i.ebayimg.com/images/g/YBQAAOSwfXBoCGhj/s-l1200.jpg",
  "steve-nash":
    "https://legacymedia.sportsplatform.io/images_root/slides/photos/000/649/247/108099592_original.jpg?1295450612",
  "steve-nash-lakers":
    "https://www.usatoday.com/gcdn/media/USATODAY/USATODAY/2013/02/13/02-13-2013-steve-nash-3_4.jpg",
  "tim-hardaway":
    "https://cdn.nba.com/teams/legacy/www.nba.com/warriors/sites/warriors/files/legacy/photos/Hardaway_Drive.jpg",
  "tim-hardaway-heat":
    "https://i.ebayimg.com/images/g/FSwAAOSwAe1ezq~M/s-l1200.jpg",
  "theo-ratliff-76ers":
    "https://platform.libertyballers.com/wp-content/uploads/sites/97/chorus/uploads/chorus_asset/file/24727654/1135829961.jpg?quality=90&strip=all&crop=13.458333333333,4.5833333333333,72.208333333333,48.138888888889",
  "tony-kukoc":
    "https://library.sportingnews.com/styles/twitter_card_120x120/s3/2021-08/toni-kukoc_2cltra16i4vs1r74zpa9u8dpm.jpeg?itok=ZA-8-1Op",
  "tom-chambers":
    "https://www.azcentral.com/gcdn/-mm-/874c7c18db031c26c316fc708f201e0ef49252e8/c=0-465-3732-5436/local/-/media/Phoenix/Phoenix/2014/08/18/1408394768000-tomchambers.jpg",
  "tyson-chandler":
    "https://a.espncdn.com/photo/2014/0721/dal_g_tchants_1296x729.jpg",
  "tyson-chandler-hornets":
    "https://i.pinimg.com/474x/93/1f/cf/931fcf6c1113db5e5df352d6f9119d41.jpg",
  "tyreke-evans":
    "https://cdn.hoopsrumors.com/files/2017/07/Tyreke-Evans-vertical.jpg",
  "tony-allen":
    "https://platform.sbnation.com/wp-content/uploads/sites/2/chorus/uploads/chorus_asset/file/15740149/GettyImages-515120984.0.1458748708.jpg?quality=90&strip=all&crop=16.662978535074,0,66.674042929852,100",
  "tom-heinsohn":
    "https://news.cgtn.com/news/2020-11-11/NBA-Boston-Celtics-legend-Tommy-Heinsohn-dies-at-86-league-mourns-VkCVGXu2TC/img/032cf925459143bbb12ee1bce02cd49f/032cf925459143bbb12ee1bce02cd49f.jpeg",
  "tayshaun-prince-grizzlies":
    "https://gbaike-image.cdn.bcebos.com/9e3df8dcd100baa1cd1107067148ae12c8fcc3ce804c/9e3df8dcd100baa1cd1107067148ae12c8fcc3ce804c_1_1?x-bce-process=image/format,f_auto",
  "terry-cummings-bucks":
    "https://www.legendsofbasketball.com/wp-content/uploads/2015/02/TerryCummings.jpg",
  "terrell-brandon-cavs":
    "https://cdn.nba.com/teams/legacy/www.nba.com/cavaliers/sites/cavaliers/files/1992-93-cavs-6.jpg",
  "terry-porter-blazers":
    "https://www.statesmanjournal.com/gcdn/-mm-/e5de92747012ea697323b87035ea8da1294bd134/c=0-70-2421-3298/local/-/media/2016/01/08/Salem/Salem/635878540438801272-GettyImages-2118155.jpg?width=458&height=610&fit=crop&format=pjpg&auto=webp",
  "tony-parker":
    "https://www.bostonherald.com/wp-content/uploads/migration/2014/10/28/05nba_parker.jpg?w=1024&h=670",
  "yao-ming":
    "https://content.api.news/v3/images/bin/306b97c2277466d4e3ab4e23efb38ce6",
  "zach-randolph":
    "https://www.sandiegouniontribune.com/wp-content/uploads/migration/2014/01/29/00000169-0cf2-dbbe-a16f-4ef208480000.jpg?w=535",
  "zach-lavine-bulls":
    "https://external-preview.redd.it/the-chicago-bulls-are-focused-on-unloading-zach-lavine-and-v0-EKSehvCODYhFQL23SQqxXeCKHr-iUwJuThBMEy_fXjk.jpg?width=640&crop=smart&auto=webp&s=02626d4fef515d4ebacd5d370b9fe9f331ef125a",
  "steve-smith-spurs":
    "https://s.hdnux.com/photos/43/66/53/9399037/7/rawImage.jpg",
  "aaron-brooks-rockets":
    "https://legacymedia.sportsplatform.io/images_root/slides/photos/000/503/082/95733886_original.jpg?1289774222",
  "domantas-sabonis-pacers":
    "https://nbcsports.brightspotcdn.com/dims4/default/777e6a1/2147483647/strip/true/crop/1024x576+0+0/resize/1440x810!/quality/90/?url=https%3A%2F%2Fnbc-sports-production-nbc-sports.s3.us-east-1.amazonaws.com%2Fbrightspot%2Fe1%2Ff2%2F3c5b0ec54fee96fbb2727cdb5fdb%2Fgettyimages-951304894-e1541646462231.jpg",
  "kemba-walker-celtics":
    "https://bostonglobe-prod.cdn.arcpublishing.com/resizer/v2/JRPODBHXSMI6TPIZYY2FNDBQRU.jpg?auth=dcf72c7532d02042278947cd67ae7524e8c42ea710608d1b87b6495935d687f5&width=1440",
  "dikembe-mutombo-hawks":
    "https://pbs.twimg.com/media/CN7ap0OWoAAZO2X.jpg",
  "wilt-chamberlain-lakers":
    "https://a.espncdn.com/photo/2017/1221/r305324_1296x729_16-9.jpg",
  "joe-johnson-nets":
    "https://www.usatoday.com/gcdn/media/USATODAY/USATODAY/2013/01/21/01-21-2013-joe-johnson-3_4.jpg?width=660&height=879&fit=crop&format=pjpg&auto=webp",
  "joe-johnson-suns":
    "https://i.pinimg.com/736x/69/e3/0c/69e30c29d0904e041509f8a07aade4bd.jpg",
  "dwight-howard-lakers":
    "https://lakersdaily.com/wp-content/uploads/2019/07/dwight-howard-lakers-e1563234724482.jpg",
  "kurt-rambis-lakers":
    "https://i.namu.wiki/i/g5tenxrFUBc3G9T3c9_TShOwWEInI6u_PKqybM0i10yCDxUcf8lsJTxoGbOLimrhWOXgPHyngINfGectP6r32Q.webp",
  "caron-butler-wizards":
    "https://s.yimg.com/ny/api/res/1.2/RY4kihagVWlTnSY9DvQcCw--/YXBwaWQ9aGlnaGxhbmRlcjt3PTY0MDtoPTc2ODtjZj13ZWJw/https://s.yimg.com/os/en_us/News/Yahoo/ept_sports_nba_experts-645358669-1266937850.jpg",
  "marc-gasol-raptors":
    "https://cdn.nba.com/manage/2019/06/marc-gasol-emotion_0.jpg",
  "shaun-livingston-nets":
    "https://nbcsports.brightspotcdn.com/dims4/default/383c7d6/2147483647/strip/false/crop/3929x2403+0+0/resize/1486x909!/quality/90/?url=https%3A%2F%2Fnbc-sports-production-nbc-sports.s3.us-east-1.amazonaws.com%2Fbrightspot%2Fa4%2Fd7%2F487963d4694ca5c242fdab002884%2F6d57cf98d828a2a7c95387625f561a19.jpg",
  "tom-chambers-supersonics":
    "https://i0.wp.com/www.seattlesportshell.com/wp-content/uploads/2012/06/Tom-Chambers.jpg?ssl=1",
  "rudy-gay-raptors":
    "https://fadeawayworld.net/wp-content/uploads/2021/10/MTg0NzE2NTI3NTM3MjM1NDMx.webp",
  "jerome-kersey-blazers":
    "https://www.nydailynews.com/wp-content/uploads/migration/2015/02/19/XJNHQW4X4G2T6U6VFBCLFRLVWM.jpg?w=620",
  "george-mcginnis-pacers":
    "https://img.topnews.live/resize-4/photos/638381749178157938.jpg",
  "kevin-durant-nets":
    "https://pyxis.nymag.com/v1/imgs/031/1e4/8624fe26c49094b3910d0d0b2f144f07c7-Kevin-Durant.rsquare.w400.jpg",
  "julius-randle-pelicans":
    "https://i0.wp.com/crescentcitysports.com/wp-content/uploads/2018/11/pelicans-randle-dribble.jpg?fit=800%2C517&ssl=1",
  "kendrick-perkins-thunder":
    "https://basketnews.com/image-46359-crop516x516.jpg",
  "zach-lavine-timberwolves":
    "https://cdn.nba.com/teams/legacy/www.nba.com/timberwolves/sites/timberwolves/files/getty-images-521642102.jpg",
  "stephen-jackson-bobcats":
    "https://www.sandiegouniontribune.com/wp-content/uploads/migration/2011/06/24/00000169-0ceb-dbbe-a16f-4eeb04db0000.jpg?w=535",
  "eric-gordon-clippers":
    "https://ca-times.brightspotcdn.com/dims4/default/97dd96a/2147483647/strip/true/crop/5660x3184+0+0/resize/1200x675!/quality/75/?url=https%3A%2F%2Fcalifornia-times-brightspot.s3.amazonaws.com%2F77%2F58%2F498758fd46fc93e9ce7aad15440e%2Fclippers-basketball-42366.jpg",
  "nick-young-wizards":
    "https://cdn.bleacherreport.net/images_root/slides/photos/000/740/086/107696998_original.jpg?1298316157",
  "kenyon-martin-nuggets":
    "https://cdn.nba.com/teams/legacy/www.nba.com/nuggets/sites/nuggets/files/gettyimages-52133799.jpg?im=Resize=(640)",
  "chris-mullin-pacers":
    "https://grantland.com/wp-content/uploads/2011/08/grant_g_d1_mullin_57611.jpg?w=750",
  "nate-thurmond-warriors":
    "https://i0.wp.com/www.ourweekly.com/wp-content/uploads/2016/07/nate-thurmond.jpg?fit=1200%2C1199&quality=89&ssl=1",
  "jimmy-butler-timberwolves":
    "https://e0.365dm.com/18/10/2048x1152/skysports-jimmy-butler-minnesota-timberwolves_4449819.jpg?20181011120959",
  "pau-gasol-grizzlies":
    "https://ca-times.brightspotcdn.com/dims4/default/62c7508/2147483647/strip/true/crop/313x425+0+0/resize/313x425!/quality/75/?url=https%3A%2F%2Fcalifornia-times-brightspot.s3.amazonaws.com%2Fec%2F34%2Fd017a581e3114bbec73e4a614681%2Flat-gasoltraded-jvkwtknc",
  "vernon-maxwell-rockets":
    "https://nypost.com/wp-content/uploads/sites/2/2022/08/vernon-maxwell.jpg",
  "fred-vanvleet-rockets":
    "https://library.sportingnews.com/styles/twitter_card_120x120/s3/2024-11/Fred%20VanVleet%20%28AP%29.jpg?itok=66_599-x",
  "robert-horry-rockets":
    "https://cdn.nba.com/teams/uploads/sites/1610612745/2024/11/GettyImages-531230174.jpg?im=Resize=(640)",
  "vlade-divac-lakers":
    "https://i.ebayimg.com/images/g/WPYAAOSwzTRcw2ZZ/s-l1200.jpg",
  "mark-price-cavs":
    "https://pbs.twimg.com/profile_images/1536172382536323073/_K_rtdqK_400x400.jpg",
  "julius-randle-lakers":
    "https://lakersdaily.com/wp-content/uploads/2021/02/oilwmx-randle.1223-e1613595253397.jpg",
  "ray-allen-bucks":
    "https://www.si.com/.image/t_share/MTY4MTU1MDcxNjM1OTI0MjQx/ray-allen-bucks-inlinejpg.jpg",
  "deron-williams-cavaliers":
    "https://legacymedia.sportsplatform.io/img/images/photos/003/661/945/hi-res-e4cd6d80b9aa418f9c89e55d4eaece2a_crop_north.jpg?1488430927&w=630&h=420",
  "andrew-wiggins-timberwolves":
    "https://www.usatoday.com/gcdn/-mm-/ddbf0548f4eff91a70e049889dee9a6b9de60b97/c=1612-0-3964-3136/local/-/media/2017/07/31/USATODAY/USATODAY/636371144767062813-USP-NBA--Golden-State-Warriors-at-Minnesota-Timber.jpg?width=660&height=880&fit=crop&format=pjpg&auto=webp",
  "deron-williams-nets":
    "https://upload.wikimedia.org/wikipedia/commons/5/55/Deron_Williams_Nets_2.jpg",
  "jimmy-butler-76ers":
    "https://heatnation.com/wp-content/uploads/2019/07/USATSI_12664977-e1562006264479.jpg",
  "larry-nance-suns":
    "https://cdn.nba.com/manage/2025/08/GettyImages-2512529-1ln.jpg",
};

const runtimeCache = new Map<string, string | null>();

const getStorageCache = () => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string | null>) : {};
  } catch {
    return {};
  }
};

const saveStorageCache = (cache: Record<string, string | null>) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // Ignore storage write issues and continue with in-memory cache.
  }
};

const getImageLookupName = (player: Player) =>
  player.name
    .replace(/\s*\(2025-26\)$/, "")
    .replace(/\./g, "")
    .replace(/Åž/g, "S")
    .replace(/Å¡/g, "s")
    .replace(/Ã¼/g, "u")
    .replace(/Ã¶/g, "o")
    .replace(/Ã¤/g, "a")
    .replace(/Ã³/g, "o")
    .replace(/Ã¡/g, "a")
    .replace(/Ã©/g, "e")
    .replace(/Ã±/g, "n");

const toPlayerImageId = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const getBasePlayerImageId = (player: Player) =>
  toPlayerImageId(player.name.replace(/\s*\([^)]*\)\s*$/, "").trim());

const getDirectImageOverride = (player: Player) =>
  currentSeasonHeadshotUrls[player.id] ??
  directImageOverrides[player.id] ??
  directImageOverrides[getBasePlayerImageId(player)];

const getWikiTitle = (player: Player) =>
  wikiTitleOverrides[player.id] ?? encodeURIComponent(getImageLookupName(player));

export const getCachedPlayerImage = (player: Player) => {
  const directOverride = getDirectImageOverride(player);
  if (directOverride) {
    runtimeCache.set(player.id, directOverride);
    const storageCache = getStorageCache();
    if (storageCache[player.id] !== directOverride) {
      storageCache[player.id] = directOverride;
      saveStorageCache(storageCache);
    }
    return directOverride;
  }

  if (runtimeCache.has(player.id)) return runtimeCache.get(player.id) ?? null;
  const storageCache = getStorageCache();
  if (player.id in storageCache) {
    runtimeCache.set(player.id, storageCache[player.id]);
    return storageCache[player.id];
  }
  return null;
};

export const fetchPlayerImage = async (player: Player) => {
  const directOverride = getDirectImageOverride(player);
  if (directOverride) {
    runtimeCache.set(player.id, directOverride);
    const storageCache = getStorageCache();
    storageCache[player.id] = directOverride;
    saveStorageCache(storageCache);
    return directOverride;
  }

  const cached = getCachedPlayerImage(player);
  if (cached !== null) return cached;

  const title = getWikiTitle(player);

  try {
    const response = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${title}`,
    );
    if (!response.ok) throw new Error("Image lookup failed");

    const data = (await response.json()) as {
      thumbnail?: { source?: string };
      originalimage?: { source?: string };
    };

    const image =
      data.thumbnail?.source ??
      data.originalimage?.source ??
      null;

    runtimeCache.set(player.id, image);
    const storageCache = getStorageCache();
    storageCache[player.id] = image;
    saveStorageCache(storageCache);

    return image;
  } catch {
    runtimeCache.set(player.id, null);
    const storageCache = getStorageCache();
    storageCache[player.id] = null;
    saveStorageCache(storageCache);
    return null;
  }
};
