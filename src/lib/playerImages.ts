import { Player } from "../types";

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
  "nikola-jokic": "Nikola_Joki%C4%87",
  "kareem-abdul-jabbar-bucks": "Kareem_Abdul-Jabbar",
  "kareem-abdul-jabbar-lakers": "Kareem_Abdul-Jabbar",
  "kobe-bryant-8": "Kobe_Bryant",
  "kobe-bryant-24": "Kobe_Bryant",
  "kevin-durant-thunder": "Kevin_Durant",
  "kevin-durant-warriors": "Kevin_Durant",
  "lebron-james-03-10": "LeBron_James",
  "lebron-james-heat": "LeBron_James",
  "lebron-james-14-18": "LeBron_James",
  "lebron-james-lakers": "LeBron_James",
  "luka-doncic": "Luka_Don%C4%8Di%C4%87",
  "giannis-antetokounmpo": "Giannis_Antetokounmpo",
  "dikembe-mutombo": "Dikembe_Mutombo",
  "yao-ming": "Yao_Ming",
  "tracy-mcgrady-raptors": "Tracy_McGrady",
  "tracy-mcgrady-magic": "Tracy_McGrady",
  "tracy-mcgrady-rockets": "Tracy_McGrady",
  "penny-hardaway": "Anfernee_Hardaway",
  "amar-e-stoudemire": "Amar%27e_Stoudemire",
  "kyrie-irving": "Kyrie_Irving",
  "chauncey-billups": "Chauncey_Billups",
  "walt-frazier": "Walt_Frazier",
};

const directImageOverrides: Record<string, string> = {
  "lebron-james-03-10":
    "https://people.com/thmb/JniFF0gr_aiZGdimoMhcJBZy-Y8=/4000x0/filters:no_upscale():max_bytes(150000):strip_icc():focal(667x0:669x2)/gettyimages-2674798-2000-54630ad5a0da4f9183d390d943552844.jpg",
  "lebron-james-heat":
    "https://cdn.forumcomm.com/dims4/default/f093fbe/2147483647/strip/true/crop/4243x2829+0+78/resize/840x560!/quality/90/?url=https%3A%2F%2Ffcc-cue-exports-brightspot.s3.us-west-2.amazonaws.com%2Fduluthnewstribune%2Fbinary%2Fcopy%2F83%2F02%2F1ea484ecdcfcdcf43edcb4841755%2F930825-lebronjames0625-binary-1587828.jpg",
  "lebron-james-14-18":
    "https://videos.usatoday.net/Brightcove2/29906170001/2015/06/29906170001_4282564439001_USATSI-8601943.jpg?pubId=29906170001",
  "lebron-james-lakers":
    "https://upload.wikimedia.org/wikipedia/commons/7/7a/LeBron_James_%2851959977144%29_%28cropped2%29.jpg",
  "dwayne-wade-03-10":
    "https://64.media.tumblr.com/f6d35d71ea04dfd298926ad166aa1ec2/tumblr_q65qyn6DxT1uf9qj8o1_1280.jpg",
  "kareem-abdul-jabbar-bucks":
    "https://pbs.twimg.com/media/FBmMlNuWUAMFF-T.jpg",
  "kareem-abdul-jabbar-lakers":
    "https://images.imagerenderer.com/images/artworkimages/mediumlarge/3/kareem-abdul-jabbar-dick-raphael.jpg",
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
  "kevin-durant-thunder":
    "https://i.ebayimg.com/images/g/h1oAAOSwTaBm-OO0/s-l400.jpg",
  "kevin-durant-warriors":
    "https://static01.nyt.com/images/2017/04/07/sports/07durant-web1/07durant-web1-articleLarge.jpg?quality=75&auto=webp&disable=upscale",
  "kevin-garnett-timberwolves":
    "https://www.twincities.com/wp-content/uploads/2015/11/20080318__cst_Kevin_Garnett_2_.jpg?w=640",
  "ray-allen-sonics":
    "https://www.sportsnet.ca/wp-content/uploads/2013/07/allen_ray640.jpg",
  "ray-allen-celtics":
    "https://www.telegram.com/gcdn/authoring/2012/07/07/NTEG/ghows-WT-a43ed083-7b8a-4e5f-85b5-85f31a6db240-71e16e40.jpeg?width=660&height=1018&fit=crop&format=pjpg&auto=webp",
  "dennis-rodman":
    "https://legacymedia.sportsplatform.io/images_root/slides/photos/000/537/881/245838_original.jpg?1291222858",
  "deron-williams":
    "https://www.ocregister.com/wp-content/uploads/migration/kpl/kplldb-05smith1large.jpg?w=640",
  "david-robinson":
    "https://image.tmdb.org/t/p/w500/iFhzUGajalDsdS7AkfK4F6LpnwL.jpg",
  "david-west":
    "https://s.yimg.com/ny/api/res/1.2/1URZLSMLOWz0JCnDcSJcJg--/YXBwaWQ9aGlnaGxhbmRlcjt3PTY0MDtoPTgwMDtjZj13ZWJw/https://s.yimg.com/os/en_us/News/Yahoo/ept_sports_nba_experts-811739762-1301064162.jpg",
  "dave-cowens":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Dave_Cowens.jpeg/250px-Dave_Cowens.jpeg",
  "damian-lillard":
    "https://dailyevergreen.com/wp-content/uploads/2023/02/Damian_Lillard_51658256323_cropped.jpg",
  "demar-derozan":
    "https://s.hdnux.com/photos/55/04/41/11814990/4/ratio3x2_1920.jpg",
  "devin-booker":
    "https://substackcdn.com/image/fetch/$s_!7fFL!,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F3cd3f21f-93f0-40da-831d-7ca7995a24d9_1172x1410.jpeg",
  "dirk-nowitzki":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/DirkNowitzki.jpg/250px-DirkNowitzki.jpg",
  "tracy-mcgrady-raptors":
    "https://library.sportingnews.com/styles/twitter_card_120x120/s3/2022-01/tracy-mcgrady-raptors-nbae-gettyimages_1meed57to9r3u1ccn3bzrz2i3n.jpg?itok=ZAmhluC9",
  "tracy-mcgrady-magic":
    "https://minutemedia-ressh.cloudinary.com/image/upload/v1694362739/shape/cover/sport/b8054764aa2a084b84b074543a6962fc573ce351b6839c1a0194511a19e2b2c1.jpg",
  "dwight-howard":
    "https://cdn.bleacherreport.net/images_root/slides/photos/000/709/700/108926554_original.jpg?1297284921",
  "draymond-green":
    "https://cdn.nba.com/manage/2021/12/draymondgreen-6-784x441.jpg",
  "eddie-jones":
    "https://lakersnation.com/wp-content/uploads/2018/04/Eddie-Jones.jpg",
  "elgin-baylor":
    "https://people.com/thmb/A985skBp-7CoPESTJY01mMG8XBo=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():focal(750x379:752x381)/elgin-baylor-1-2000-9afb8cf311fb480fbbe2b12f31a66bf5.jpg",
  "glen-rice":
    "https://cdn.nba.com/teams/legacy/www.nba.com/hornets/sites/hornets/files/glen-rice-trophy.jpg",
  "gary-payton":
    "https://seattlerefined.com/resources/media2/original/full/1600/center/80/6a629ef3-d789-4f97-981d-732166f15da4-GettyImages2007517168.jpg",
  "hakeem-olajuwon":
    "https://preview.redd.it/i-asked-gemini-to-argue-why-hakeem-olajuwon-is-the-greatest-v0-098c1wd77ege1.jpeg?width=640&crop=smart&auto=webp&s=ba0ec03f9f7f9a70bdb2f5d9d9737c66f624f8bd",
  "dominique-wilkins":
    "https://i.namu.wiki/i/_p4r0n_sWZahVy6vsCWg4dK1KcNNx2vBCbSJjwbjB0B365GupjEiopY2yTuP-jncxj9LCC3gJA60vmcfXrebCg.webp",
  "isiah-thomas":
    "https://64.media.tumblr.com/912f8901ce1a8a6690bb587ec529c536/tumblr_inline_ov22dc3uzs1up8ogc_1280.jpg",
  "julius-erving":
    "https://cdn.nba.com/manage/2020/10/julius-erving-nets-392x588.jpg",
  "james-harden":
    "https://s.hdnux.com/photos/56/50/16/12223372/6/rawImage.jpg",
  "jaylen-brown":
    "https://fieldlevelmedia.com/wp-content/uploads/2025/12/27725863-1024x768.jpg",
  "jason-kidd":
    "https://www.si.com/.image/t_share/MTY4MjU5ODQ5Nzc5MjI2NDk3/image-placeholder-title.jpg",
  "jrue-holiday":
    "https://s7d2.scene7.com/is/image/TWCNews/ap-jrue-holiday-bucks_02032023",
  "jimmy-butler":
    "https://hips.hearstapps.com/hmg-prod/images/jimmy-butler-of-the-miami-heat-reacts-during-the-fourth-news-photo-1682620143.jpg?crop=0.670xw:1.00xh;0.185xw,0&resize=1200:*",
  "kareem-abdul-jabbar":
    "https://pbs.twimg.com/media/FBmMlNuWUAMFF-T.jpg",
  "karl-malone":
    "https://i.pinimg.com/736x/73/d9/68/73d968077baa340b28ac64d2e9054b84.jpg",
  "karl-anthony-towns":
    "https://library.sportingnews.com/styles/crop_style_16_9_desktop_webp/s3/2025-11/USATSI_27497309.jpg.webp?itok=NN6B__v3",
  "john-stockton":
    "https://static.wikia.nocookie.net/nba/images/9/99/John_Stockton.jpg/revision/latest?cb=20110427165243",
  "joel-embiid":
    "https://legacymedia.sportsplatform.io/image/upload/x_0,y_184,w_1800,h_1200,c_crop/v1714164900/hfsvqpzkbmjjxnmiqlpf.jpg",
  "joakim-noah":
    "https://imengine.public.prod.pdh.navigacloud.com/?uuid=5CC10E8D-80D5-4458-AB22-18E690FBBB8A&type=preview&function=cover&height=609&width=800",
  "jerry-west":
    "https://substackcdn.com/image/fetch/$s_!qTIb!,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F8c741afd-26ed-4064-b63a-26e15ab21a9b_1200x675.jpeg",
  "jermaine-o-neal":
    "https://talksport.com/wp-content/uploads/2025/06/GettyImages-1256412765.jpg?strip=all&w=636",
  "john-wall":
    "https://upload.wikimedia.org/wikipedia/commons/e/ef/Wall2wizz.jpg",
  "kawhi-leonard":
    "https://www.uticaod.com/gcdn/authoring/2019/06/13/NOBD/ghows-NY-b55ce3d7-0e3c-4aa1-a1ea-a6c5cb5c94c2-1f669383.jpeg?width=1200&disable=upscale&format=pjpg&auto=webp",
  "kobe-bryant":
    "https://cdn.artphotolimited.com/images/67ceea65865e9b3b9ef7de2b/300x300/kobe-bryant-2001-nba-finals.jpg",
  "kevin-durant":
    "https://static01.nyt.com/images/2017/04/07/sports/07durant-web1/07durant-web1-articleLarge.jpg?quality=75&auto=webp&disable=upscale",
  "kevin-love":
    "https://upload.wikimedia.org/wikipedia/commons/8/81/Kevin_Love_2.jpg",
  "khris-middleton":
    "https://legacymedia.sportsplatform.io/image/upload/x_0,y_162,w_1800,h_1195,c_crop/v1733413087/gz9weasipxfilgyr6uke.jpg",
  "kyrie-irving":
    "https://www.usatoday.com/gcdn/-mm-/daafdabb5e49ae55569e2dbfe59cf6ee99818eef/c=87-0-2373-3048/local/-/media/2017/05/24/USATODAY/USATODAY/636311815863708051-USP-NBA-PLAYOFFS-BOSTON-CELTICS-AT-CLEVELAND-CAVA-91150919-1-.JPG?width=660&height=881&fit=crop&format=pjpg&auto=webp",
  "lebron-james":
    "https://videos.usatoday.net/Brightcove2/29906170001/2015/06/29906170001_4282564439001_USATSI-8601943.jpg?pubId=29906170001",
  "larry-bird":
    "https://www.usatoday.com/gcdn/-mm-/6d4245ebf464808df4dc3cdaddd9036c915be31f/c=0-300-3139-4486/local/-/media/2016/12/07/USATODAY/USATODAY/636167048457676560-XXX-LARRY-BIRD-PUTS-UP-A-JUMPSHOT-1706669AB-DNA007-20214831.JPG?width=458&height=610&fit=crop&format=pjpg&auto=webp",
  "lamar-odom":
    "https://cdn.bleacherreport.net/images_root/slides/photos/000/669/536/80849705_original.jpg?1296086977",
  "luka-doncic":
    "https://media.about.nike.com/img/c287f478-579c-4c31-a5da-3a92411694e9/luka-doncic-enlarge2-2.jpg?m=eyJlZGl0cyI6eyJqcGVnIjp7InF1YWxpdHkiOjEwMH0sIndlYnAiOnsicXVhbGl0eSI6MTAwfSwiZXh0cmFjdCI6eyJsZWZ0Ijo3OTQsInRvcCI6MTAsIndpZHRoIjoxMjc1LCJoZWlnaHQiOjIxMjN9LCJyZXNpemUiOnsid2lkdGgiOjM4NDB9fX0%3D&s=383fe9bab9113f62527527c9c79a8719d45edbdf7d0213113a9373d21d927848",
  "luol-deng":
    "https://s.yimg.com/ny/api/res/1.2/GEAryxjoxksW27QRWzM0Zg--/YXBwaWQ9aGlnaGxhbmRlcjt3PTQyMDtoPTEyMTA7Y2Y9d2VicA--/https://s.yimg.com/os/en_US/Sports/USA_Today/20130422_ajl_aw8_068-c6ede438b04fba0c579c583e4f962544",
  "magic-johnson":
    "https://cdn.artphotolimited.com/images/65802cc8bd40b870df716a6a/1000x1000/magic-johnson-leads-the-game-1992.jpg",
  "marc-gasol":
    "https://legacymedia.sportsplatform.io/img/images/photos/003/169/247/hi-res-65448a15ec276e9c5dc852fc6125fb21_crop_north.jpg?1416874909&w=630&h=420",
  "manute-bol":
    "https://s.hdnux.com/photos/65/02/217260/4/1920x0.jpg",
  "manu-ginobili":
    "https://cdn.nba.com/manage/2022/09/ginobili-emotion.jpg",
  "michael-jordan":
    "https://static.wikia.nocookie.net/nbastreet/images/9/97/FDB1BF72-3F75-446F-B4F2-000331AE638B.jpeg/revision/latest?cb=20210419024456",
  "mitch-richmond":
    "https://cdn.nba.com/teams/legacy/www.nba.com/warriors/sites/warriors/files/legacy/photos/Richmond_Rock.jpg",
  "moses-malone":
    "https://media.gq.com/photos/55f7333e2de2e54e38605818/1:1/w_1326,h_1326,c_limit/moses-malone-sixers.jpg",
  "nikola-jokic":
    "https://legacymedia.sportsplatform.io/image/upload/v1733625555/ecaf3qwgo1vbermrwtoh.jpg",
  "vince-carter-raptors":
    "https://slamonline.com/wp-content/uploads/2014/07/vince_1.jpg",
  "victor-wembanyama":
    "https://media-cldnry.s-nbcnews.com/image/upload/t_fit-760w,f_auto,q_auto:best/rockcms/2024-06/240627-Victor-Wembanyama-se-343p-2b5ced.jpg",
  "wilt-chamberlain":
    "https://i.redd.it/r5zobke7ea9e1.jpeg",
  "walt-frazier":
    "https://cdn.britannica.com/07/258007-050-4F67E33A/Basketball-player-Walt-Frazier-dribbles-the-ball-against-the-Baltimore-Bullets-during-an-NBA-basketball-game-1971.jpg",
  "oscar-robertson":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Oscar_Robertson1971.jpg/250px-Oscar_Robertson1971.jpg",
  "pau-gasol":
    "https://static.wikia.nocookie.net/nbasports/images/9/91/San_Antonio_Spurs_v_Los_Angeles_Lakers_Game_0_MoFFLaWuhl.jpg/revision/latest/scale-to-width-down/323?cb=20130705212405",
  "paul-george":
    "https://cdn.nba.com/teams/legacy/www.nba.com/pacers/sites/pacers/files/pgstepsup.jpg",
  "patrick-ewing":
    "https://blacknewsandviews.com/wp-content/uploads/2025/02/PatrickEwing-Knicks-SHIB-AP-BNV-scaled.jpg",
  "rajon-rondo":
    "https://phantom.estaticos-marca.com/656509dffaa08214d5dc8346a1a77c04/resize/828/f/jpg/assets/multimedia/imagenes/2024/04/03/17120952468819.jpg",
  "rick-barry":
    "https://sportscollectorsdigest.com/uploads/MjA0MzY2ODE4MTU0OTE0ODkz/barry-free-throws-getty.jpg?format=auto&optimize=high&width=1440",
  "rik-smits":
    "https://cdn.nba.com/teams/legacy/www.nba.com/pacers/sites/pacers/files/97-97_smits_vs._golden_state_1_11.1.97.jpg",
  "rip-hamilton":
    "https://www.vintagedetroit.com/wp-content/uploads/2011/02/Rip-Hamilton.jpg",
  "pete-maravich":
    "https://platform.slcdunk.com/wp-content/uploads/sites/145/chorus/uploads/chorus_asset/file/24912240/1094463402.jpg?quality=90&strip=all&crop=0,16.666666666667,100,66.666666666667",
  "penny-hardaway":
    "https://cdn.nba.com/teams/legacy/www.nba.com/magic/sites/magic/files/9_penny-20170112.jpg",
  "peja-stojakovic":
    "https://cdn.nba.com/teams/legacy/www.nba.com/kings/sites/kings/files/2_24.jpg",
  "reggie-miller":
    "https://www.tuscaloosanews.com/gcdn/authoring/2007/08/09/NTTN/ghows-DA-956c6365-614f-4280-8405-f5e1f84e025e-1569fd9a.jpeg?width=1200&disable=upscale&format=pjpg&auto=webp",
  "russell-westbrook":
    "https://pbs.twimg.com/media/GxcIsZZXsAAWwst.jpg",
  "ray-allen":
    "https://www.sportsnet.ca/wp-content/uploads/2013/07/allen_ray640.jpg",
  "ralph-sampson":
    "https://ca-times.brightspotcdn.com/dims4/default/081ceb5/2147483647/strip/true/crop/2400x3598+0+0/resize/1200x1799!/quality/75/?url=https%3A%2F%2Fcalifornia-times-brightspot.s3.amazonaws.com%2Ffd%2F1d%2F94f40646432fb2f69e6a85371d01%2Fgettyimages-52165394.jpg",
  "rudy-gobert":
    "https://preview.redd.it/rudy-gobert-most-overpaid-centre-in-the-league-player-v0-h8d1onx1y8yf1.jpeg?auto=webp&s=ae785a82d69885d504af76751efe8c218fafbdc0",
  "ben-wallace":
    "https://nbatimemachine.wordpress.com/wp-content/uploads/2017/01/ben-wallace-net-worth1.jpg",
  "bernard-king":
    "https://images.imagerenderer.com/images/artworkimages/mediumlarge/2/new-york-knicks-bernard-king-nathaniel-s-butler.jpg",
  "bob-mcadoo":
    "https://cdn.nba.com/teams/legacy/www.nba.com/clippers/sites/clippers/files/legacy/photos/mcadoo-file-110812-3.jpg",
  "bradley-beal":
    "https://upload.wikimedia.org/wikipedia/commons/e/eb/Bradley_Beal_Wizards.jpg",
  "bill-russell":
    "https://delta.creativecirclecdn.com/quill/original/20231116-115407-65563457d7cc9image.jpg",
  "blake-griffin":
    "https://www.rollingstone.com/wp-content/uploads/2018/06/rs-20057-20140415-blakeg-x1800-1397571870.jpg",
  "chris-paul-hornets":
    "https://legacymedia.sportsplatform.io/images_root/slides/photos/000/538/714/106958476_original.jpg?1291243979",
  "chris-paul-clippers":
    "https://gsp-image-cdn.wmsports.io/cms/prod/bleacher-report/getty_images/136109782_large_image.jpg",
  "chris-bosh":
    "https://cdn.hoopsrumors.com/files/2017/07/USATSI_9094830.jpg",
  "chris-mullin":
    "https://hoopshallny.org/wp-content/uploads/2023/08/Chris-Mullin.jpg",
  "chris-webber":
    "https://preview.redd.it/how-well-do-you-guys-see-a-prime-chris-webber-doing-in-v0-l2kk3m3vv2xf1.jpeg?width=640&crop=smart&auto=webp&s=5a5b2716a6b1f5db7dca2179333fd4db7077faf7",
  "charles-barkley":
    "https://cdn.nba.com/teams/uploads/sites/1610612755/2023/01/barkley2.png",
  "anthony-davis":
    "https://www.usatoday.com/gcdn/presto/2019/01/25/USAT/8face4bf-fda9-4585-8fce-19d456e2fe5d-2019-01-24_Anthony_Davis1.jpg?crop=1744,2326,x365,y211",
  "anthony-edwards":
    "https://cdn.nba.com/teams/uploads/sites/1610612750/2025/01/GettyImages-2155325565.jpg",
  "andrei-kirilenko":
    "https://i.redd.it/j3hz609fagz91.jpg",
  "adrian-dantley":
    "https://cdn.nba.com/teams/uploads/sites/1610612762/2023/11/GettyImages-499320108.jpg",
  "allen-iverson":
    "https://cdn.nba.com/manage/2022/03/ai3-scaled.jpg",
  "carmelo-anthony-nuggets":
    "https://images.imagerenderer.com/images/artworkimages/mediumlarge/3/carmelo-anthony-andrew-d-bernstein.jpg",
  "carmelo-anthony-knicks":
    "https://cdn.bleacherreport.net/images_root/slides/photos/000/748/228/109386852_original.jpg?1298564512",
  "carlos-boozer":
    "https://cdn.nba.com/teams/legacy/www.nba.com/jazz/sites/jazz/files/gettyimages-98852331.jpg",
  "chauncey-billups":
    "https://news.cgtn.com/news/3355544d356b6a4e306b544d3541444f3359444f31457a6333566d54/img/90771ec99d1e41d691b78f720b733601/90771ec99d1e41d691b78f720b733601.jpg",
  "clyde-drexler":
    "https://images.imagerenderer.com/images/artworkimages/mediumlarge/3/clyde-drexler-dale-tait.jpg",
  "shaquille-o-neal":
    "https://preview.redd.it/who-would-you-rather-have-prime-shaq-or-prime-giannis-v0-d0ogt1n4r6pe1.jpg?width=640&crop=smart&auto=webp&s=d72c0c9849e683ce07b4bfbe0ed627556c0247c5",
  "shawn-kemp":
    "https://i.ebayimg.com/images/g/K9IAAOSwH-9emMX0/s-l1200.jpg",
  "shai-gilgeous-alexander":
    "https://cdn.prod.website-files.com/64da5279f1559b26fb07550e/6834c822e2ddaf129383c171_Best%20Shai%20Gilgeous-Alexander%20Pick%20for%20Timberwolves%20vs.%20Thunder%20Game%204.jpg",
  "shawn-marion":
    "https://cdn.nba.com/teams/legacy/www.nba.com/suns/sites/suns/files/shawn_marion_retires_35.jpg",
  "scottie-pippen":
    "https://i.redd.it/x1b00sjpzz7d1.jpeg",
  "steph-curry":
    "https://compote.slate.com/images/24605cda-82b1-4342-9af9-4b86f684174b.jpg",
  "stephen-jackson":
    "https://s.hdnux.com/photos/44/05/36/9459624/4/rawImage.jpg",
  "steve-nash":
    "https://legacymedia.sportsplatform.io/images_root/slides/photos/000/649/247/108099592_original.jpg?1295450612",
  "tim-hardaway":
    "https://cdn.nba.com/teams/legacy/www.nba.com/warriors/sites/warriors/files/legacy/photos/Hardaway_Drive.jpg",
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

const getWikiTitle = (player: Player) =>
  wikiTitleOverrides[player.id] ?? encodeURIComponent(player.name.replace(/\./g, ""));

export const getCachedPlayerImage = (player: Player) => {
  const directOverride = directImageOverrides[player.id];
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
  const directOverride = directImageOverrides[player.id];
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
