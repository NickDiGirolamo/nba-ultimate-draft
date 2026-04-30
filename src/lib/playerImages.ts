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
  "btg-anthony-davis":
    "https://platform.sbnation.com/wp-content/uploads/sites/2/chorus/uploads/chorus_asset/file/14212085/20130119_tjg_ah6_069.0.1358814165.jpg?quality=90&strip=all&crop=0.012500000000003%2C0%2C99.975%2C100&w=2400",
  "cj-mccollum-blazers":
    "https://media.gq.com/photos/56fe0a4d42f1abb10ad77965/master/pass/CJ-McCollum-Flex.jpg",
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
  "alvin-robertson":
    "https://cdn.nba.com/manage/2025/09/GettyImages-22077237251-1.jpg",
  "al-harrington":
    "https://a.espncdn.com/photo/2015/0318/nba_g_harrington1_1296x729.jpg",
  "al-harrington-knicks":
    "https://elitesportsny.com/app/uploads/2020/06/GettyImages-84341724-scaled-e1591641118629.jpg",
  "al-jefferson":
    "https://gbaike-image.cdn.bcebos.com/a8014c086e061d950a7ba7c619ac1dd162d9f3d35c8e/a8014c086e061d950a7ba7c619ac1dd162d9f3d35c8e_1_1?x-bce-process=image/format,f_auto",
  "antoine-walker":
    "https://s.yimg.com/ny/api/res/1.2/HR11OwlOXmp97.WbU2oyxQ--/YXBwaWQ9aGlnaGxhbmRlcjt3PTYzMDtoPTQ3NDtjZj13ZWJw/https://media.zenfs.com/en/blogs/sptusnbaexperts/Please-keep-your-laughter-to-a-dull-roar.-Elsa-Getty-Images.jpg",
  "antawn-jamison":
    "https://sportshub.cbsistatic.com/i/r/2019/08/14/94e6f272-2902-413f-bf0b-5f0eea31b99d/thumbnail/1200x675/ca961306b9e45c84bd90a20e0556b663/antawn-jamison.jpg",
  "anthony-bennett":
    "https://s.yimg.com/ny/api/res/1.2/jlw9IyRO4KtmuuwUMfkRSw--/YXBwaWQ9aGlnaGxhbmRlcjt3PTY0MDtoPTQ4MjtjZj13ZWJw/https://s.yimg.com/os/en/blogs/sptusnbaexperts/AB101113.jpg",
  "anderson-varejao":
    "https://i.redd.it/j7un02j6t3hb1.jpg",
  "andrew-bogut":
    "https://cdn.hoopsrumors.com/files/2016/07/USATSI_9181135.jpg",
  "andrew-bynum":
    "https://cdn.nba.com/teams/legacy/www.nba.com/lakers/sites/lakers/files/legacy/photos/1112bynum500_16.jpg",
  "ben-simmons":
    "https://s.yimg.com/ny/api/res/1.2/6gLOD33FWFZ.CabmnfWnSA--/YXBwaWQ9aGlnaGxhbmRlcjt3PTI0MDA7aD0xNjAwO2NmPXdlYnA-/https://s.yimg.com/os/creatr-uploaded-images/2021-06/7a1739a0-d293-11eb-b7ef-89d62d7a2801",
  "bill-laimbeer":
    "https://miro.medium.com/v2/resize:fit:1400/1*lEBPd61CJNJ-jFhQt6o0OQ.jpeg",
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
  "shawn-kemp":
    "https://images.squarespace-cdn.com/content/v1/5f6a2443c6004d000a8d74df/1601064096489-5253447VSV5RBED3EX5C/Shawn+Kemp+Seattle+Sonics.jpg",
  "shawn-bradley":
    "https://hips.hearstapps.com/hmg-prod/images/shawn-bradley-of-the-dallas-mavericks-during-the-game-news-photo-1616120129.?crop=1.00xw:0.665xh;0,0.189xh&resize=1200:*",
  "steve-francis":
    "https://platform.thedreamshake.com/wp-content/uploads/sites/160/chorus/uploads/chorus_asset/file/23060422/1296004841.jpg?quality=90&strip=all&crop=0,0,100,100",
  "trae-young":
    "https://a.espncdn.com/photo/2024/1128/r1420742_1296x729_16-9.jpg",
  "kevin-durant-thunder":
    "https://i.ebayimg.com/images/g/h1oAAOSwTaBm-OO0/s-l400.jpg",
  "kevin-durant-warriors":
    "https://static01.nyt.com/images/2017/04/07/sports/07durant-web1/07durant-web1-articleLarge.jpg?quality=75&auto=webp&disable=upscale",
  "kevin-garnett-timberwolves":
    "https://www.twincities.com/wp-content/uploads/2015/11/20080318__cst_Kevin_Garnett_2_.jpg?w=640",
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
  "rafer-alston":
    "https://s.hdnux.com/photos/11/24/37/2443219/8/ratio2x3_1920.jpg",
  "sam-jones":
    "https://assets-cms.thescore.com/uploads/image/file/489638/w640xh480_GettyImages-125340831.jpg?ts=1640972089",
  "reggie-evans":
    "https://static.ffx.io/images/w_744%2Ch_419%2Cc_fill%2Cg_auto:faces/q_86%2Cf_auto/2a027bd7c691c156c4357bd623a2a0cd2db725c1",
  "dennis-rodman-pistons":
    "https://res.cloudinary.com/ybmedia/image/upload/c_crop,h_2000,w_1358,x_0,y_0/c_scale,f_auto,q_auto,w_700/v1/m/f/4/f467f1fe94bb4e70abf58cfe4132f4035fd188ca/drafted-detroit-pistons.jpg",
  "dennis-rodman-bulls":
    "https://legacymedia.sportsplatform.io/images_root/slides/photos/000/537/881/245838_original.jpg?1291222858",
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
  "david-west":
    "https://s.yimg.com/ny/api/res/1.2/1URZLSMLOWz0JCnDcSJcJg--/YXBwaWQ9aGlnaGxhbmRlcjt3PTY0MDtoPTgwMDtjZj13ZWJw/https://s.yimg.com/os/en_us/News/Yahoo/ept_sports_nba_experts-811739762-1301064162.jpg",
  "dave-cowens":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Dave_Cowens.jpeg/250px-Dave_Cowens.jpeg",
  "danny-green":
    "https://www.si.com/.image/c_fill,w_720,ar_16:9,f_auto,q_auto,g_auto/MTY4MDI3NTIwNzc0Nzc2MDgx/danny-green-spurs-leadjpg.jpg",
  "damian-lillard":
    "https://dailyevergreen.com/wp-content/uploads/2023/02/Damian_Lillard_51658256323_cropped.jpg",
  "danny-granger":
    "https://static.wikia.nocookie.net/nba/images/1/1d/Danny_Granger.jpg/revision/latest?cb=20131018180555",
  "dell-curry":
    "https://cdn.nba.com/teams/legacy/www.nba.com/hornets/sites/hornets/files/curry_10.jpg",
  "demarcus-cousins":
    "https://imageio.forbes.com/specials-images/dam/imageserve/889147320/960x0.jpg?height=491&width=711&fit=bounds",
  "dennis-scott":
    "https://a57.foxsports.com/statics.foxsports.com/www.foxsports.com/content/uploads/2020/02/1280/1280/2767b86a-121313-fsf-nba-magic-dennis-scott-PI.jpg?ve=1&tl=1",
  "dennis-johnson":
    "https://www.sportscasting.com/wp-content/uploads/2022/09/Dennis-Johnson.jpg",
  "deandre-jordan":
    "https://www.usatoday.com/gcdn/-mm-/d623784b05f4053452310ce1a88cae460a9d736d/c=301-178-2113-2595/local/-/media/2015/07/08/USATODAY/USATODAY/635719576544244668-USP-NBA-Playoffs-Los-Angeles-Clippers-at-Houston.jpg",
  "derek-fisher":
    "https://www.ocregister.com/wp-content/uploads/migration/kz2/kz2fjn-kz2fneraptorsmarfisher.jpg?w=535",
  "demarre-carroll":
    "https://www.azcentral.com/gcdn/-mm-/db6444a6459f7df93857db300d6c1b54988d3669/c=277-0-1859-2109/local/-/media/2015/07/01/Phoenix/Phoenix/635713531430203704-carroll-raptors.jpg",
  "devin-harris":
    "https://www.si.com/.image/t_share/MTY4MjYxMTg4MjAzNjUyMjYx/devin-harriscolumnjpg.jpg",
  "chris-andersen":
    "https://www.usatoday.com/gcdn/media/USATODAY/USATODAY/2013/05/31/1370038951000-birdmansuspension-1305311824_3_4.jpg?width=660&height=876&fit=crop&format=pjpg&auto=webp",
  "hedo-turkoglu":
    "https://cdn.nba.com/teams/legacy/www.nba.com/magic/sites/magic/files/legacy/photos/turk7_700_040313.jpg",
  "donovan-mitchell":
    "https://heavy.com/wp-content/uploads/2019/01/donovanmitchelljazz-e1548262534388.jpg?quality=65&strip=all",
  "domantas-sabonis":
    "https://static01.nyt.com/athletic/uploads/wp/2024/01/28193550/GettyImages-1961733651-e1706488587580.jpg",
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
  "tim-duncan":
    "https://lh4.googleusercontent.com/proxy/9grgcOgfb2fRXziFVmY2OpRZTvxOlD90mJF27Hc-8EM_DXr7hVpFMqY_cKMOBbEssodvCsCxWGNjUVfhMMEWeRrRjAuqTQe5mZ-Xw9rSFHQJhSqr_BwvT67FM0nGS-C2UgfqlC5cwK81jqCPo3ghmvzGkIp1Z4I",
  "tacko-fall":
    "https://nypost.com/wp-content/uploads/sites/2/2019/10/tacko-fall-2-1.jpg?quality=75&strip=all&w=1200",
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
  "gheorghe-muresan":
    "https://alianta.org/wp-content/uploads/2023/08/Gheorghe-Muresan.png",
  "george-gervin":
    "https://i.ebayimg.com/images/g/EwUAAMXQTgZQ~gIT/s-l400.jpg",
  "gerald-wallace":
    "https://www.denverpost.com/wp-content/uploads/2016/05/20090227__20090228_C06_SP28BKNPLUGp1.jpg?w=640",
  "glenn-robinson":
    "https://basket-retro.com/wp-content/uploads/2017/01/glenn-robinson-milwaukee-bucks-c-getty.jpg?w=834",
  "marcin-gortat":
    "https://www.washingtonpost.com/wp-apps/imrs.php?src=https://arc-anglerfish-washpost-prod-washpost.s3.amazonaws.com/public/ZUD3D5EBQEI6JHZYSWQYPZGB64&w=1800&h=1800",
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
  "isaiah-thomas":
    "https://www.usatoday.com/gcdn/-mm-/bbb7acd158147fd2985120443dd8879162707f25/c=229-32-2658-3271/local/-/media/2017/05/19/USATODAY/USATODAY/636308108765948291-USP-NBA-PLAYOFFS-BOSTON-CELTICS-AT-WASHINGTON-WIZ-90748336.JPG",
  "julius-erving":
    "https://library.sportingnews.com/styles/crop_style_16_9_desktop_webp/s3/2021-08/dr-j_1g92ttzi3oi9e11be3fpqs9k0f.jpeg.webp?itok=tfShklKY",
  "james-harden-rockets":
    "https://s.hdnux.com/photos/56/50/16/12223372/6/rawImage.jpg",
  "james-harden-nets":
    "https://s.hdnux.com/photos/56/50/16/12223372/6/rawImage.jpg",
  "james-harden-clippers":
    "https://basketnews.com/image-455013-crop516x516.jpg",
  "jaylen-brown":
    "https://fieldlevelmedia.com/wp-content/uploads/2025/12/27725863-1024x768.jpg",
  "jason-kidd":
    "https://www.si.com/.image/t_share/MTY4MjU5ODQ5Nzc5MjI2NDk3/image-placeholder-title.jpg",
  "jason-richardson":
    "https://s.hdnux.com/photos/42/27/47/9009620/4/1920x0.jpg",
  "j-r-smith":
    "https://content.wkyc.com/photo/2015/06/12/635697111403072209-USATSI-8603838_32914_ver1.0.jpg",
  "j-j-redick":
    "https://www.usatoday.com/gcdn/media/USATODAY/gameon/2012/11/19/usp-nba_-orlando-magic-at-minnesota-timberwolves-16_9.jpg",
  "jimmy-butler":
    "https://hips.hearstapps.com/hmg-prod/images/jimmy-butler-of-the-miami-heat-reacts-during-the-fourth-news-photo-1682620143.jpg?crop=0.670xw:1.00xh;0.185xw,0&resize=1200:*",
  "kareem-abdul-jabbar":
    "https://pbs.twimg.com/media/FBmMlNuWUAMFF-T.jpg",
  "karl-malone":
    "https://cdn.britannica.com/38/256938-050-D1B6AF47/Karl-Malone-NBA-Utah-Jazz-basketball-player.jpg",
  "keith-van-horn":
    "https://netswire.usatoday.com/gcdn/authoring/images/smg/2024/12/28/SNET/77289263007-9-8376.jpeg?width=1200&disable=upscale&format=pjpg&auto=webp",
  "kevin-johnson":
    "https://images.imagerenderer.com/images/artworkimages/mediumlarge/3/3-kevin-johnson-rocky-widner.jpg",
  "kevin-martin":
    "https://s.yimg.com/ny/api/res/1.2/7NsS71Nx96i_ltL8TbC2yg--/YXBwaWQ9aGlnaGxhbmRlcjt3PTY0MDtoPTQ4MjtjZj13ZWJw/https://media.zenfs.com/en/homerun/feed_manager_auto_publish_494/197d6958cd3f878c5c8c518215217012",
  "paul-millsap":
    "https://a57.foxsports.com/statics.foxsports.com/www.foxsports.com/content/uploads/2020/03/1280/1280/9011189-paul-millsap-nba-portland-trail-blazers-atlanta-hawks.jpg?ve=1&tl=1",
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
  "jerry-west":
    "https://substackcdn.com/image/fetch/$s_!qTIb!,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F8c741afd-26ed-4064-b63a-26e15ab21a9b_1200x675.jpeg",
  "jerry-stackhouse":
    "https://legacymedia.sportsplatform.io/images_root/slides/photos/000/460/756/71199326_original.jpg?1287806899",
  "jermaine-o-neal":
    "https://i.pinimg.com/474x/98/2b/e1/982be1309c31e86758ad2fc37d3c2580.jpg",
  "jeremy-lin":
    "https://lh3.googleusercontent.com/proxy/CtGYIgM_bc3aqlUAC0luMAk1UtZgjKjfUSJQFJuqB3iFIMSzBZh31e9xd6TAT0Ru6lO2iaIYhHLaBNPCGPspHlp1IDanGCR7mdsFbBJhmuCmOyEYYX3gUfGF2Lba36E4y6Bf",
  "jalen-rose":
    "https://cdn.nba.com/teams/legacy/www.nba.com/pacers/sites/pacers/files/506131_10_0.jpg",
  "john-wall":
    "https://upload.wikimedia.org/wikipedia/commons/e/ef/Wall2wizz.jpg",
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
  "khris-middleton-bucks":
    "https://legacymedia.sportsplatform.io/image/upload/x_0,y_162,w_1800,h_1195,c_crop/v1733413087/gz9weasipxfilgyr6uke.jpg",
  "kerry-kittles":
    "https://slamonline.com/wp-content/uploads/2016/05/Kittles-for-Online.jpg",
  "kyrie-irving":
    "https://www.usatoday.com/gcdn/-mm-/daafdabb5e49ae55569e2dbfe59cf6ee99818eef/c=87-0-2373-3048/local/-/media/2017/05/24/USATODAY/USATODAY/636311815863708051-USP-NBA-PLAYOFFS-BOSTON-CELTICS-AT-CLEVELAND-CAVA-91150919-1-.JPG?width=660&height=881&fit=crop&format=pjpg&auto=webp",
  "kyrie-irving-cavs":
    "https://www.usatoday.com/gcdn/-mm-/daafdabb5e49ae55569e2dbfe59cf6ee99818eef/c=87-0-2373-3048/local/-/media/2017/05/24/USATODAY/USATODAY/636311815863708051-USP-NBA-PLAYOFFS-BOSTON-CELTICS-AT-CLEVELAND-CAVA-91150919-1-.JPG?width=660&height=881&fit=crop&format=pjpg&auto=webp",
  "kyrie-irving-mavs":
    "https://live-production.wcms.abc-cdn.net.au/56f684ab95740e22d77e1bfb3281c6ad?impolicy=wcms_crop_resize&cropH=3139&cropW=3139&xPos=780&yPos=0&width=862&height=862",
  "kyle-korver":
    "https://www.usatoday.com/gcdn/media/USATODAY/USATODAY/2012/11/07/usp-nba_-indiana-pacers-at-atlanta-hawks-16_9.jpg",
  "alonzo-mourning-hornets":
    "https://cdn.nba.com/teams/legacy/www.nba.com/hornets/sites/hornets/files/181026_mourning_08.jpg",
  "lamarcus-aldridge":
    "https://www.usatoday.com/gcdn/-mm-/cc18c14920ff4d366d49560a7f4acafbc28884e2/c=85-81-1484-1947/local/-/media/2015/07/04/USATODAY/USATODAY/635716344825258869-USP-NBA-PLAYOFFS-PORTLAND-TRAIL-BLAZERS-AT-MEMPHI-72530096.JPG",
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
  "luka-doncic":
    "https://media.about.nike.com/img/c287f478-579c-4c31-a5da-3a92411694e9/luka-doncic-enlarge2-2.jpg?m=eyJlZGl0cyI6eyJqcGVnIjp7InF1YWxpdHkiOjEwMH0sIndlYnAiOnsicXVhbGl0eSI6MTAwfSwiZXh0cmFjdCI6eyJsZWZ0Ijo3OTQsInRvcCI6MTAsIndpZHRoIjoxMjc1LCJoZWlnaHQiOjIxMjN9LCJyZXNpemUiOnsid2lkdGgiOjM4NDB9fX0%3D&s=383fe9bab9113f62527527c9c79a8719d45edbdf7d0213113a9373d21d927848",
  "luol-deng":
    "https://s.yimg.com/ny/api/res/1.2/GEAryxjoxksW27QRWzM0Zg--/YXBwaWQ9aGlnaGxhbmRlcjt3PTQyMDtoPTEyMTA7Y2Y9d2VicA--/https://s.yimg.com/os/en_US/Sports/USA_Today/20130422_ajl_aw8_068-c6ede438b04fba0c579c583e4f962544",
  "lou-williams":
    "https://www.si.com/.image/t_share/MTY4MDA3NTMwNjUwNzQwMDk2/lou-williams-clippers-sixth-man-leadjpg.jpg",
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
  "jamal-wilkes":
    "https://static.wikia.nocookie.net/nba/images/3/30/Jamaal_Wilkes.jpg/revision/latest?cb=20260223020926",
  "jay-williams":
    "https://www.the-sun.com/wp-content/uploads/sites/6/2023/09/user-expressly-acknowledges-agrees-downloading-846224676.jpg?strip=all&w=636",
  "jameer-nelson":
    "https://static01.nyt.com/athletic/uploads/wp/2019/09/03171747/GettyImages-1009199212-e1567545493143.jpg",
  "mark-aguirre":
    "https://cdn.nba.com/teams/legacy/www.mavs.com/wp-content/uploads/2020/05/GettyImages-114076423.jpg",
  "mark-jackson":
    "https://i.pinimg.com/474x/76/0b/c4/760bc48967e7b36d68aff1774b712cc9.jpg",
  "marcus-camby":
    "https://cdn.nba.com/teams/legacy/www.nba.com/nuggets/sites/nuggets/files/cambyheader.jpg",
  "marc-gasol":
    "https://legacymedia.sportsplatform.io/img/images/photos/003/169/247/hi-res-65448a15ec276e9c5dc852fc6125fb21_crop_north.jpg?1416874909&w=630&h=420",
  "manute-bol":
    "https://s.hdnux.com/photos/65/02/217260/4/1920x0.jpg",
  "manu-ginobili":
    "https://cdn.nba.com/manage/2022/09/ginobili-emotion.jpg",
  "maurice-cheeks":
    "https://cdn.nba.com/teams/uploads/sites/1610612755/2023/01/cheeks2.png",
  "willis-reed":
    "https://nypost.com/wp-content/uploads/sites/2/2023/03/NYPICHPDPICT000008577101.jpg",
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
  "mike-bibby":
    "https://www.legendsofbasketball.com/wp-content/uploads/2020/11/mike-bibby.jpg",
  "mike-conley":
    "https://legacymedia.sportsplatform.io/img/images/photos/003/647/141/ee95d67ca7a8afeca79d93afec516857_crop_north.jpg?1481914896&w=630&h=420",
  "mo-williams":
    "https://content.wkyc.com/photo/2015/07/10/635721301186971570-109082014_1262224_ver1.0.jpg",
  "mitch-richmond":
    "https://cdn.nba.com/teams/legacy/www.nba.com/warriors/sites/warriors/files/legacy/photos/Richmond_Rock.jpg",
  "nene":
    "https://legacymedia.sportsplatform.io/img/images/photos/003/190/007/hi-res-34a630b24c5f16f8fba21af6c3aca8a4_crop_north.jpg?1418178310=&w=3800&h=2000",
  "nate-robinson":
    "https://images.nymag.com/images/2/daily/2010/01/20100119_naterobinson_250x375.jpg",
  "moses-malone":
    "https://media.gq.com/photos/55f7333e2de2e54e38605818/1:1/w_1326,h_1326,c_limit/moses-malone-sixers.jpg",
  "muggsy-bogues":
    "https://m.media-amazon.com/images/M/MV5BMWQzY2IzNzAtZWZkNS00YWQ0LTlmZmQtZmUyOWZhYWEwNzEwXkEyXkFqcGc@._V1_.jpg",
  "vince-carter-raptors":
    "https://images2.minutemediacdn.com/image/upload/c_fill,w_1200,ar_1:1,f_auto,q_auto,g_auto/images/GettyImages/mmsport/85/01jbmdxx4br82fyxjjk6.jpg",
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
  "oscar-robertson":
    "https://external-preview.redd.it/photo-of-the-day-the-big-o-tested-veteran-point-guard-oscar-v0-2fl5SvnfW1U1dIitlWSKsU6kdL0rxSqrcQ2eXvNmkPA.jpg?width=640&crop=smart&auto=webp&s=16b2f8c129b2d02506dbc40c8a621489e7f48f29",
  "o-j-mayo":
    "https://cdn.nba.com/teams/legacy/www.nba.com/grizzlies/sites/grizzlies/files/legacy/main_photo/mayo-081013-jm131-300.jpg",
  "pau-gasol":
    "https://static.wikia.nocookie.net/nbasports/images/9/91/San_Antonio_Spurs_v_Los_Angeles_Lakers_Game_0_MoFFLaWuhl.jpg/revision/latest/scale-to-width-down/323?cb=20130705212405",
  "paul-george":
    "https://cdn.nba.com/teams/legacy/www.nba.com/pacers/sites/pacers/files/pgstepsup.jpg",
  "pascal-siakam":
    "https://cdn.nba.com/teams/legacy/www.nba.com/raptors/sites/raptors/files/siakam_0.jpg",
  "pascal-siakam-raptors":
    "https://www.sportsnet.ca/wp-content/uploads/2022/04/Siakam-4-768x432.jpg",
  "patrick-ewing":
    "https://blacknewsandviews.com/wp-content/uploads/2025/02/PatrickEwing-Knicks-SHIB-AP-BNV-scaled.jpg",
  "rajon-rondo":
    "https://phantom.estaticos-marca.com/656509dffaa08214d5dc8346a1a77c04/resize/828/f/jpg/assets/multimedia/imagenes/2024/04/03/17120952468819.jpg",
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
  "reggie-miller":
    "https://www.tuscaloosanews.com/gcdn/authoring/2007/08/09/NTTN/ghows-DA-956c6365-614f-4280-8405-f5e1f84e025e-1569fd9a.jpeg?width=1200&disable=upscale&format=pjpg&auto=webp",
  "robert-parish":
    "https://s.yimg.com/ny/api/res/1.2/882IvYtfStkE8iCZMwl3qw--/YXBwaWQ9aGlnaGxhbmRlcjt3PTY0MDtoPTc4MTtjZj13ZWJw/https://media.zenfs.com/en/celtics_wire_usa_today_sports_articles_699/3c37a5b411ecd07a9130974c2c565823",
  "hasheem-thabeet":
    "https://fanbuzz.com/wp-content/uploads/sites/5/2022/03/Hasheem-Thabeet-Now.png?w=1056",
  "robert-horry":
    "https://oneway77jc.com/cdn/shop/products/ROBERT.jpg?v=1666502059",
  "richard-jefferson":
    "https://netswire.usatoday.com/gcdn/authoring/images/smg/2024/12/28/SNET/77289195007-9-8521.jpeg",
  "russell-westbrook":
    "https://pbs.twimg.com/media/GxcIsZZXsAAWwst.jpg",
  "ray-allen":
    "https://www.sportsnet.ca/wp-content/uploads/2013/07/allen_ray640.jpg",
  "rashard-lewis":
    "https://www.sandiegouniontribune.com/wp-content/uploads/migration/2009/05/21/00000169-0ce2-dbbe-a16f-4ee294730000.jpg?w=535",
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
    "https://images.imagerenderer.com/images/artworkimages/mediumlarge/2/new-york-knicks-bernard-king-nathaniel-s-butler.jpg",
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
  "chris-paul-hornets":
    "https://legacymedia.sportsplatform.io/images_root/slides/photos/000/538/714/106958476_original.jpg?1291243979",
  "chris-paul-clippers":
    "https://gsp-image-cdn.wmsports.io/cms/prod/bleacher-report/getty_images/136109782_large_image.jpg",
  "chris-bosh-raptors":
    "https://s.yimg.com/ny/api/res/1.2/TOA_.ISO02dk2Rf4uym0fg--/YXBwaWQ9aGlnaGxhbmRlcjt3PTY0MDtoPTQyNTtjZj13ZWJw/https://s.yimg.com/os/creatr-uploaded-images/2021-09/268c2920-14a2-11ec-bddf-7cac2f45a5b2",
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
  "adrian-dantley":
    "https://cdn.nba.com/teams/uploads/sites/1610612762/2023/11/GettyImages-499320108.jpg",
  "alex-english":
    "https://images.imagerenderer.com/images/artworkimages/mediumlarge/2/denver-nuggets-alex-english-andrew-d-bernstein.jpg",
  "allan-houston":
    "https://www.backsportspage.com/wp-content/uploads/2017/06/allan_houston.jpg",
  "al-horford-hawks":
    "https://cdn.nba.com/teams/legacy/www.nba.com/hawks/sites/hawks/files/horford-easternconference.jpg",
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
  "p-j-brown":
    "https://minutemedia-ressh.cloudinary.com/image/upload/v1693491643/shape/cover/sport/928b5be80bb2a4797aed71bf0edd20963f636105e55000f4e79e999064b1d80e.jpg",
  "chauncey-billups":
    "https://news.cgtn.com/news/3355544d356b6a4e306b544d3541444f3359444f31457a6333566d54/img/90771ec99d1e41d691b78f720b733601/90771ec99d1e41d691b78f720b733601.jpg",
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
  "sam-cassell":
    "https://cdn3.sbnation.com/imported_assets/590084/51824836.jpg.13789.0_display_image.jpg",
  "stromile-swift":
    "https://media.gettyimages.com/id/1256951329/photo/washington-dc-stromile-swift-of-the-memphis-grizzlies-handles-the-ball-against-the-washington.jpg?s=612x612&w=gi&k=20&c=4ytq5QcXGhvyTBlqBXBi_9LZSsWhPrLN5md4zyRWuXM=",
  "shawn-marion":
    "https://cdn.nba.com/teams/legacy/www.nba.com/suns/sites/suns/files/shawn_marion_retires_35.jpg",
  "scottie-pippen":
    "https://i.redd.it/x1b00sjpzz7d1.jpeg",
  "latrell-sprewell":
    "https://cdn.nba.com/teams/legacy/www.nba.com/knicks/sites/knicks/files/gettyimages-72527249.jpg",
  "detlef-schrempf":
    "https://library.sportingnews.com/styles/twitter_card_120x120/s3/2021-08/detlef-schrempf_1w4bb26e9ij2s1iqm4xp8btugg.jpeg?itok=TTc5qR0B",
  "steph-curry":
    "https://compote.slate.com/images/24605cda-82b1-4342-9af9-4b86f684174b.jpg",
  "stephen-jackson":
    "https://s.hdnux.com/photos/44/05/36/9459624/4/rawImage.jpg",
  "stephon-marbury":
    "https://i.pinimg.com/736x/8c/78/c9/8c78c9fd594a89740164aeef98f35994.jpg",
  "steve-kerr":
    "https://i.ebayimg.com/images/g/YBQAAOSwfXBoCGhj/s-l1200.jpg",
  "steve-nash":
    "https://legacymedia.sportsplatform.io/images_root/slides/photos/000/649/247/108099592_original.jpg?1295450612",
  "tim-hardaway":
    "https://cdn.nba.com/teams/legacy/www.nba.com/warriors/sites/warriors/files/legacy/photos/Hardaway_Drive.jpg",
  "tony-kukoc":
    "https://library.sportingnews.com/styles/twitter_card_120x120/s3/2021-08/toni-kukoc_2cltra16i4vs1r74zpa9u8dpm.jpeg?itok=ZA-8-1Op",
  "tom-chambers":
    "https://www.azcentral.com/gcdn/-mm-/874c7c18db031c26c316fc708f201e0ef49252e8/c=0-465-3732-5436/local/-/media/Phoenix/Phoenix/2014/08/18/1408394768000-tomchambers.jpg",
  "tyson-chandler":
    "https://a.espncdn.com/photo/2014/0721/dal_g_tchants_1296x729.jpg",
  "tyreke-evans":
    "https://cdn.hoopsrumors.com/files/2017/07/Tyreke-Evans-vertical.jpg",
  "tony-allen":
    "https://platform.sbnation.com/wp-content/uploads/sites/2/chorus/uploads/chorus_asset/file/15740149/GettyImages-515120984.0.1458748708.jpg?quality=90&strip=all&crop=16.662978535074,0,66.674042929852,100",
  "tony-parker":
    "https://www.bostonherald.com/wp-content/uploads/migration/2014/10/28/05nba_parker.jpg?w=1024&h=670",
  "yao-ming":
    "https://content.api.news/v3/images/bin/306b97c2277466d4e3ab4e23efb38ce6",
  "zach-randolph":
    "https://www.sandiegouniontribune.com/wp-content/uploads/migration/2014/01/29/00000169-0cf2-dbbe-a16f-4ef208480000.jpg?w=535",
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

const getWikiTitle = (player: Player) =>
  wikiTitleOverrides[player.id] ?? encodeURIComponent(getImageLookupName(player));

export const getCachedPlayerImage = (player: Player) => {
  const directOverride =
    currentSeasonHeadshotUrls[player.id] ?? directImageOverrides[player.id];
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
  const directOverride =
    currentSeasonHeadshotUrls[player.id] ?? directImageOverrides[player.id];
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
