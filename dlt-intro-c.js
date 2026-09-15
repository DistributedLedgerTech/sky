/* DLT intro, variant C "Phosphor".
   Pure 2D canvas. A halftone globe rendered as a character raster on a lime
   phosphor CRT: land density and a rotating light terminator pick the glyph
   and its brightness, glitch slices tear the raster whenever a boot line
   prints, a decorative hash feed scrolls under the globe, and the exit is a
   cathode collapse (picture squeezes to a line, then a dot) into the page.

   Colors: lime #c7ff2e, white #ffffff, ink #0b0b0b. Nothing else.
   Boot hooks kept from dlt-site.js: [data-boot], [data-boot-line],
   [data-boot-progress], [data-boot-percent], [data-boot-skip], Enter/Escape,
   10 s hard cap, body.boot-locked, prefers-reduced-motion. */
(() => {
  'use strict';

  const LIME = '#c7ff2e';
  const WHITE = '#ffffff';
  const INK = '#0b0b0b';
  const MONO = '"SFMono-Regular",Consolas,"Liberation Mono",Menlo,monospace';
  const RAMP = ' .:-=+*#%@';
  const HEX = '0123456789ABCDEF';
  const TAU = Math.PI * 2;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Land coverage, 256 x 128, 4 bits per texel, equirectangular (x = lon, y = lat
     from north). Baked once from world-atlas land-50m; no runtime fetch. */
  const MW = 256;
  const MH = 128;
  const MASK_B64 = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACEQAAAAAAAAAAEkJDZmd3ZCAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADRmiIzv3+///ctTRYh2WIit/v/////N25cBAUIQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACfLZ7nbzb3///yHib3/////////////////7N/rhSAAAAAAAAAAAAAAEwIgAAAAAAAAAURSIlhzUkIAAAAAAQAAAAI5uiAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAANjEwOL7/6b3f/ut1IDWf////////////////////1BAAAAAAAAAAAAA5qqupiZYQAAAAAAAAAAEAAQEAAAAAAAAAAAAAAEWt3BZBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABJLkQE0eCWUJYVbvv/8gwWd3P////////////////////1BAAAAAAAAAAAAAAJp3mSnEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABZpYRAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWqqdUAYETY1dEdnhXm5mpIAACXe273//////////////////IYAAAAAAAAAAAAAAAJyAAAAAAAAAAAAAAAAAAAANEaWAAAAAAAAAAACIhR//7eZcgAAAAAAAAAAAgEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADKJ3ZqoITaVSkfruszcMAAAAAAAAAXP////////////////wxAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAKM2FMQAAAAAAAQA3q97////////HAAAAAAAAAAFNu3cEZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAF/9u1IQACVABocJukFnNXRlEAAAAAAAABv//////////////dphAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAbrMAAAABMAAABGaJ/////////qmZdWYgAWRBAAAQAmUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAC3/yd/su5r0Bo/TtjDPm/+6vWAAAAAAAABv/////////////9wwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABn4AAAAAC3YJTeIv//////////+//////7e//oAAAAHu5VnIAAAAAAAAAAAAAACZmZmZmZmm7zLiGZmZmZmZmZmZkVmd2aZmZuWZmiphnqamZiZmYq3ZmZmZmiYmZmZmZmZmZl4V3ZmZmZmVmZmZmZmZmZmZmaLq6hmZmZmZmZmZlaGZmZmmZlay5mnmZmZmZmZmZmZmZmZmZmZmcuZiYmZmZmKzd3ZZmZmZmZmZBIiIiIiEc///////czIhANmi71piWMq3///3+kzl5+1IUnaZlrv//tCIiIiK6j//////////++1IiIiIiIiIiIiIiIiIhJarf//+6ZDEiIiIkQiAiJplzTf+Z7f//////////////////////////////////////1YmIg5u7ljFa7///1QAAAAAAAAAAAAAQAAAAAAAAB7mMcorLxHggIJsQTv94kgAnvv////VAAAAAAAACeKvv/////////////////+sxAAAAAAAAAWr/iPyVNkQEAAAFAB4SQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAQBGa//7qCAAAAAAAAAAAAAAAAAAAAAAAAAwAAAAEQAAE0SO/97DABMBbv//0QAAAAAAEV7////u//3v////////////ogAAAAAAAEUxA7tlYAAAAAAAAAAklAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIZTRHukRENEREREREREREREREREREREREREREREREREdnjMu9vGREXJGLu7u2RERERDd7u7u7u4d0RGq7u7u7u7u7u8xERERIhERER77IREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREMyAAAxMgAiKP////////////////////////////////xzbohANCKf/PsQAAAACf///+IAAAAAAAB723MAAAAAAAAAAEr///6hfv///+qf/////////////////////////////////////////////////////////////////7EAAAACAG7////////////////////////////////+cgABRANGRRR6hAAAAAAAn//+MAAAAAAAAAAAAAAAAAAAAAF8////sQ3//////////////////////////////////////////////////////////////////57////ZhQAAAAAArv////++2u///////////////////////+MAAAAAAV//5yACAAAAAAAIvfoAAAAAAAAAAAAAAAAAAAAABf////9QC///7///////////////////////////////////////////////////////////1RKln/7ukwAAAAAAAAUWb///s6dBBEaO////////////////////kAAAAAAAP///gQZwAAAAAAABYQAAAAAAAAAAAAAAAAAAAQAE3/3///QRaHSu/////////////////////////////////////////////////////bzMi/wQAY90MBEAAAAAAAAAAAACNO10AAAAAABqv//////////////////qAAAAAABu///qnvcAAAAAAAAAAAAAAAAAAAAAAAAAAoUAAACLQN/9IQJN//////////////////////////////////////////////////////5gAAABEAFc+CAAAAAAAAAAAAAAAABJcGMAAAAAAASL//////////////////+qcQAAAQf//////yAAAAAAAAAAAAAAAAAAAAAAAAAE/2AAAAGXP/sSDb3/////////////////////////////////////////////////////kQAAAAAAG//9AAAAAAAAAAAAAAABRlEAAAAAAAAAAAqv///////////////////+pVICTf//////xAAAAAAAAAAAAAAAAAAAAAAAAESuoAAAAtWIQAAe/////////////////////////////////////////////////////8UAAAAAAABf//MAEAAAAAAAAAAAAxIAAAAAAAAAAAAABCrv////////////////////+Ab////////91AAAAAAAAAAAAAAAAAAAAAAK+xT7AAACuppq6///////////////////////////////////////////////////////2FcDAAAAAD/9QAAAAAAAAAAAEAAgAAAAAAAAAAAAAAABMY/////////////////////8Me//////////QAAAAAAAAAAAAAAAAAAAAB34Lf+iCP///////////////////////////////////////////////////////////////50AAAAADcIAAAAAAQAAAQAAAAAAAAAAAAAAAAAAAAAAGv/////////////////////I/////////4kwAAAAAAAAAAAAAAAAAAAAFRA8/ZSv////////////////////////////////////////////////////////////////ThAAAAAHIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAG2+//////////////////////////dGhSLUIAAAAAAAAAAAAAAAAAAAAAADISfv////////////////////////////////////////////////////////////////0OYAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAaf////////////////////////8rcIQC//BAAAAAAAAAAAAAAAAAAAAAAKq//////////////////////////////////////////////////////////////////+AcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAATv///////////////////////+7/0gISJFQAAAAAAAAAAAAAAAAAAAAAABn///////////////3/2c/////Iv///////////////////////////////////////+gGgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAv//////////////////////////67qCAAAAAAAAAAAAAAAAAAAAAAAAAAAM/////+rv//////YI5E7///1QKP//////////////////////////////////////+xAhAAEQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAE/////////////////////////7YcUgAAAAAAAAAAAAAAAAAAAAAAAAAQAA7///x+0j7/////cAFAKP//+AG///////////////////////////////////////+QAExSEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAf////////////////////////7AAAAAAAAAAAAAAAAAAAAAAAAAAAABf/t3/9SQDX9EH7///wAAAAAO//9EDz////////////////////////////////////3hQADroIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABP///////////////////////6YAAAAAAAAAAAAAAAAAAAAAAAAAAAAD////6RAAYDroE//+/kRs2EIp//+wBG///////////////////////////////////0AAAAQwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAE///////////////////////2AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAX///4xIADQADxS73BLz/////////QF7//////////////////////////////mbL/VAAAAB9AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAC/////////////////////+4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAACP///AAAADABJxA9oj7/////////wADP////////////////////////////+zAgHuQAAAALkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB3////////////////////8EAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADnP2yADNEZAegAAlhB+7v7v/////5Ir//////////////////////////////yoEC7QAABJ8wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABf////////////////////0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEQQbP///6AAAAABMBExYX///////////////////////////////////////2AAD/ADV//QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAbP//////////////////swAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAr///////cAAAAAARAABAn//////////////////////////////////////+QAAVEGqtYwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAf/////////////////cAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAE3////////nUgABYQAAAAH////////////////////////////////////////gAAEHpiEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOrP//////////////UAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA3///////////QQv+t0FFKP////////////////////////////////////////gAAARgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAaU/////////f6Ga88gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADv////////////nv/////v//////qv////////////////////////////////5gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGef//////swAxAAHYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEBGv///////////////////73/////9Qz////////////////////////////////4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAATjj/////sAAAAAAK0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQb/////////////////////4q/////9IY/t/////////////////////////////7AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABsK/////AAAAAAALQEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAT//////////////////////2Hf////+0ADXO///v////////////////////////IAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB2Cf///5AAAAAAABAwAAAAAAAAAAAAAAAAAAAAAAAAAAAAC///////////////////////4V//////ok5AARAE///////////////////////+Q4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQQr///cAAAAAA1YQAAAAAAAAAAAAAAAAAAAAAAAAAAAAB////////////////////////2B/////////sQAAA7/////////+//////////7rIIQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABEQAAAAAAAAAAAAAAAAAAAAAAAe//+QAAA1EEJYowAAAAAAAAAAAAAAAAAAAAAAAAAAAe////////////////////////9D/////////1AAAAn7//////6XOf//////2tlAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABMAAAAAAAAAAAAAAAAAAAAAAA7//+IABf0QAAA8khIAAAAAAAAAAAAAAAAAAAAAAAAAr////////////////////////3Cf///////2AAAAADP/////+QAC3/////oBcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAABN//+zE8+QAAABEDv6IQAAAAAAAAAAAAAAAAAAAAAACP////////////////////////oAv//////6EAAAAAA/////9AAAA/////9AqAAAABIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABN/////0AAAAIwASADEAAAAAAAAAAAAAAAAAABAAAH/////////////////////////5Au/////nEAAAAAAA////0wAAAAz////9EAAAAAXgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA5yM/+VFEAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAv/////////////////////////4An///9QAAAAAAAAC///owAAAACln////BAAAACbAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACv//+wAAAAAAAAABAAAAAAAAAAAAAAAAAAAAL//////////////////////////8N//+cgAAAAAAAAAE//8AAAAAAABv////gAAAAGgQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJq/6AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAN///////////////////////////m6VAAAAAAAAAAAADf/xAAAAABAB6f//+wAAAAJnIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACfcAAAAHJAAAAAAAAAAAAAAAAAAAAAAAAAb///////////////////////////sAADMCAAAAAAAAAH/8AAAAABAADBLf/5AAAAATNTAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA6gAACO6/uDhTAAAAAAAAAAAAAAAAAAAAAG///////////////////////////4nP9QAAAAAAAAAADvkAAAAAAAAIADvnAAAAAwKGEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAalXdO/r////kQAAAAAAAAAAAAAAAAAAAACP/////////////////////////////hAAAAAAAAAAAJw3AAAAAAABwQBkAAAAAiAENwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA5Ce///////+MAAAAAAAAAAAAAAAAAAAAC3////////////////////////////2AAAAAAAAAAAAEU8QAAAAAAGFAAAAAAAAACfOAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB/////////VMgAAAAAAAAAAAAAAAAAAAZ/////IfP///////////////////9AAAAAAAAAAAAAAKhAAAAAAAAuAAAAAAEkAEIUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD///////////sQAAAAAAAAAAAAAAAAAABchVgwAB29//////////////////QAAAAAAAAAAAAAAAAAAAAAK3CPcAAAAG71AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAf///////////6AAAAAAAAAAAAAAAAAAAAAAAAAAAAT/////////////////cAAAAAAAAAAAAAAAAAAAAAAD2D+AAQAH/5AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM////////////4wAAAAAAAAAAAAAAAAAAAAAAAAAAAf///////////////+UAAAAAAAAAAAAAAAAAAAAAAAFOqMEAI9//0AABAiAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAK/////////////lAAAAAAAAAAAAAAAAAAAAAAAAAAAE///////////////9IAAAAAAAAAAAAAAAAAAAAAAAACj+YQB///+zRlUEQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAE/////////////76XEAAAAAAAAAAAAAAAAAAAAAAAAAj//////////////+IAAAAAAAAAAAAAAAAAAAAAAAAAAr+yAE7//2BkQAIBijIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAbv/////////////N/1IAAAAAAAAAAAAAAAAAAAAAAAA//////////////+MAAAAAAAAAAAAAAAAAAAAAAAAAABT/lhC//8BPoCEQEbYqtRAAEBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABe//////////////////5gAAAAAAAAAAAAAAAAAAAAAAX/////////////YAAAAAAAAAAAAAAAAAAAAAAAAAAAAH/1IBRacEnSAjVgi8//+1AAASAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAL////////////////////lQAAAAAAAAAAAAAAAAAAAAAI////////////0QAAAAAAAAAAAAAAAAAAAAAAAAAAAABvQAAAAACUUAAAAAOP//+QEWQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAXv////////////////////EAAAAAAAAAAAAAAAAAAAAAP////////////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGZMzEAAAAAAAAAQAj///snMAUQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH////////////////////8wAAAAAAAAAAAAAAAAAAAAAK////////////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABaL2lEREBIRACAACt/orSAAACEgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADf///////////////////QAAAAAAAAAAAAAAAAAAAAAAn///////////8gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAI1RkF3EAAAAAB3AIwxAAADQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAG///////////////////SAAAAAAAAAAAAAAAAAAAAAABf///////////6AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACASAAAAAAAAIAA1EAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADP/////////////////zAAAAAAAAAAAAAAAAAAAAAAAE////////////sAAAEQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAnqGIAGwAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAF/////////////////1AAAAAAAAAAAAAAAAAAAAAAAB7////////////QAACIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEI//wQBPEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHP////////////////QAAAAAAAAAAAAAAAAAAAAAAAX////////////+AABPwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABzn7/9wAF/CAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAfv//////////////9AAAAAAAAAAAAAAAAAAAAAAACf////////////YAOv9wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABr/////oQj/YAAAAAAAAAEQAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABv//////////////xAAAAAAAAAAAAAAAAAAAAAAAJ///////////6IACv/zAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB3///////jv/QAAAAAAAAAAAAAAcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/////////////7AAAAAAAAAAAAAAAAAAAAAAAAP//////////4AAAI/+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAn///////////UAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA3/////////////QAAAAAAAAAAAAAAAAAAAAAAAAJ/////////8AAAAj/kAABEAAAAAAAAAAAAAAAAAAAAAAAAAAAFZ3////////////6AAAAAAATAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADv////////////sAAAAAAAAAAAAAAAAAAAAAAAAAHv////////8gAAL/9AAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAbv//////////////9QAAAAAANAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAf///////////WUAAAAAAAAAAAAAAAAAAAAAAAAAAL/////////0AAAf/gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAL/////////////////UAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAC//////////9gAAAAAAAAAAAAAAAAAAAAAAAAAAAAn////////6EAAAz4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAABP/////////////////0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAT/////////9wAAAAAAAAAAAAAAAAAAAAAAAAAAAABf///////1AAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAC3/////////////////0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB//////////3AAAAAAAAAAAAAAAAAAAAAAAAAAAAAB7///////QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADv/////////////////hAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAL/////////9IAAAAAAAAAAAAAAAAAAAAAAAAAAAAABP//////sAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH//////////////////MAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA3////////8QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAv/////0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/////////////////4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADv///////+MAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAv////0gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM/////piM////////+gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAO/////+//gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAC////oQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAz///gQAABvzv/////RAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAE//////ycgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB5ZEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGukiIAAAAAhb/////1AAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAr//////1AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADPf///9AAAAAAAAAABiAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP///////cAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH///+gAAAAAAAAAAAkyAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/////25YAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAmVmAAAAAAAAAAAAHfgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAF////+wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAQAAAAAAAAAAEZsAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAff//syAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABzHAAAAAAAAAAC6UQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABs///UAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB8MAAAAAAAAAGeQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAF7//4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAftMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADv//zAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAATvUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPP//ogAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB9//+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGz/+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAS+/QAAAEQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFu8QAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFYvmEAAAAAAAAAAAACEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAkIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACEQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACJHcwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABnEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACIQAAAAAAAAAAAAAAAAAAAAIiAAACMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABWxjEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABJe/+dBAAAAAAAAAAAUZ4ipqqrP/sp7/5RENYm3TN/dyohkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEBqTAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAUit7f/////+/dtgAAAZvf////////////////////////////3YZkFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwPZbv+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAQIAAAAQACvYZN////////////+zAVau////////////////////////////////////7LgQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAUVq5//+YAAAAAAAAAAAAAAAAAAAAAADRFlGUlirzvzP/92euonP/////////////////7Et/////////////////////////////////////////93MtzEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlaHUAA0EAAAAAREeUz/+xAAAAAAAAAAAAAAAAAAAAAEf////////////////////////////////////8We//////////////////////////////////////////////sQAAAAAAAAAAAAAAAAAAAAAAAAAAEANTNyIgQSIAABa+/d7u/tyozrnazf///4AAAAAAAAAAAAAAAAAAAwF9//////////////////////////////////////7/////////////////////////////////////////////+UAAAAAAAAAAAAAAAAAAAAAAAkN5nczLzd3d3//72oiJmG3///////////////6jAAAAAAAAAAAAAAAAACJEbv///////////////////////////////////////////////////////////////////////////////////+gQAAAAAAAAAAAAAAAAASIQE2W////////////////////////////////7iIlTEAAAAAAAAAAAAAAAE3vP////////////////////////////////////////////////////////////////////////////////////////+wAQAAAAAAAAAAAAAAAErP/b7+/////////////////////////////M3KiFAAMQAAAAAAA4mUAAAFz/////////////////////////////////////////////////////////////////////////////////////////////tFQAAAAAAAAAAAAFmEACRHnP//////////////////////////////yahgAGc0EAMgAABO//9AAANFaJm8///////////////////////////////////////////////////////////////////////////////////////0EAAAAAAAAAAAAAAAAxABRmau//////////////////////////////////mIl1Q0V0AAOIdEIQJXaKvO/////////////////////////////////////////////////////////////////////////////////////////7MAAAAAAAAAAAAQAAABAAAY/////////////////////////////////////////8pxACWJq7tnv////////////////////////////////////////////////////////////////////////////////////////////////7ZSAAAAAAAAABRGhqyZrv////////////////////////////////////////////yt///////////////////////////////////////////////////////////////////////////////////////////////////////////rmHVDEAAiIjRmRDRCAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==';
  const MASK = new Uint8Array(MW * MH);
  (() => {
    const bin = atob(MASK_B64);
    for (let i = 0; i < bin.length; i += 1) {
      const b = bin.charCodeAt(i);
      MASK[i * 2] = b >> 4;
      MASK[i * 2 + 1] = b & 15;
    }
  })();

  /* Seeded PRNG so the decorative feed and the noise are stable per load. */
  const seeded = (seed) => {
    let s = seed >>> 0;
    return () => {
      s ^= s << 13; s >>>= 0;
      s ^= s >>> 17;
      s ^= s << 5; s >>>= 0;
      return (s >>> 0) / 4294967296;
    };
  };

  const NODES = [
    [40.7, -74], [37.8, -122.4], [51.5, -0.1], [48.9, 2.3], [50.1, 8.7], [35.7, 139.7],
    [1.3, 103.8], [22.3, 114.2], [-23.5, -46.6], [-33.9, 18.4], [25.3, 55.3], [-33.9, 151.2]
  ];
  const LINKS = [[0, 2], [0, 8], [0, 1], [2, 4], [2, 10], [4, 5], [5, 7], [6, 7], [6, 11], [8, 9], [10, 6], [1, 5]];

  class Phosphor {
    static create(canvas) {
      const ctx = canvas.getContext('2d', { alpha: true });
      if (!ctx) return null;
      try { return new Phosphor(canvas, ctx); } catch (error) { return null; }
    }

    constructor(canvas, ctx) {
      this.canvas = canvas;
      this.ctx = ctx;
      this.tilt = 0.36;
      this.roll = -0.22;
      this.spin = 0.00012;      /* rad per ms, globe */
      this.lightSpeed = 0.00042; /* rad per ms, terminator */
      this.rotation0 = -0.55;
      this.glitchUntil = 0;
      this.glitchSeed = 1;
      this.bands = [];
      this.bloom = null;
      this.rnd = seeded(0xC7FF2E);
      this.buildFeed();
      this.resize();
      this.observer = new ResizeObserver(() => this.resize());
      this.observer.observe(canvas);
    }

    /* ---------- layout ---------- */

    resize() {
      const rect = this.canvas.getBoundingClientRect();
      if (this.last && (!rect.width || !rect.height)) return; /* hidden after the exit */
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cssW = Math.max(120, rect.width || 120);
      const cssH = Math.max(120, rect.height || cssW);
      this.dpr = dpr;
      this.w = Math.round(cssW * dpr);
      this.h = Math.round(cssH * dpr);
      this.canvas.width = this.w;
      this.canvas.height = this.h;
      this.small = cssW < 420;
      const across = cssW >= 520 ? 80 : cssW >= 400 ? 64 : 52;
      this.cx = this.w / 2;
      this.cy = this.h * 0.45;
      this.R = Math.min(this.w, this.h) * 0.38;
      this.cell = (this.R * 2) / across;
      this.K = 0.045; /* barrel amount */
      this.buildAtlas();
      this.buildGrid(across);
      this.buildStrips();
      this.bloom = document.createElement('canvas');
      this.bloom.width = Math.max(8, Math.round(this.w / 6));
      this.bloom.height = Math.max(8, Math.round(this.h / 6));
      this.bloomCtx = this.bloom.getContext('2d');
      if (this.last) this.draw(this.last.now, this.last.t, this.last.phase);
    }

    warpX(x, y) {
      const u = (x - this.w / 2) / (this.w / 2);
      const v = (y - this.h / 2) / (this.h / 2);
      return this.w / 2 + (x - this.w / 2) * (1 - this.K * (u * u + v * v));
    }

    warpY(x, y) {
      const u = (x - this.w / 2) / (this.w / 2);
      const v = (y - this.h / 2) / (this.h / 2);
      return this.h / 2 + (y - this.h / 2) * (1 - this.K * (u * u + v * v));
    }

    buildAtlas() {
      const s = this.sprite = Math.ceil(this.cell * 1.7);
      const chars = RAMP + HEX;
      const atlas = document.createElement('canvas');
      atlas.width = s * chars.length;
      atlas.height = s * 2;
      const ctx = atlas.getContext('2d');
      ctx.font = `700 ${Math.max(4, this.cell * 1.22).toFixed(2)}px ${MONO}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      [LIME, WHITE].forEach((color, row) => {
        ctx.fillStyle = color;
        for (let i = 0; i < chars.length; i += 1) {
          ctx.fillText(chars[i], i * s + s / 2, row * s + s / 2 + this.cell * 0.04);
        }
      });
      this.atlas = atlas;
      this.hexBase = RAMP.length;
    }

    buildGrid(across) {
      const cols = across + 2;
      const cell = this.cell;
      const left = this.cx - (cols / 2) * cell;
      const top = this.cy - (cols / 2) * cell;
      const max = cols * cols;
      const X = new Float32Array(max);
      const Y = new Float32Array(max);
      const V = new Float32Array(max);
      const L0 = new Float32Array(max);
      const NX = new Float32Array(max);
      const NY = new Float32Array(max);
      const NZ = new Float32Array(max);
      const RR = new Float32Array(max);
      const ROW = new Uint16Array(max);
      const RND = new Uint8Array(max);
      const ct = Math.cos(this.tilt); const st = Math.sin(this.tilt);
      const cr = Math.cos(this.roll); const sr = Math.sin(this.roll);
      let n = 0;
      for (let j = 0; j < cols; j += 1) {
        for (let i = 0; i < cols; i += 1) {
          const px = left + (i + 0.5) * cell;
          const py = top + (j + 0.5) * cell;
          const nx = (px - this.cx) / this.R;
          const ny = (py - this.cy) / this.R;
          const rr = nx * nx + ny * ny;
          if (rr > 1) continue;
          const yu = -ny;
          const nz = Math.sqrt(1 - rr);
          /* screen normal -> body frame: undo roll (about Z), then tilt (about X) */
          const x1 = nx * cr + yu * sr;
          const y1 = -nx * sr + yu * cr;
          const bx = x1;
          const by = y1 * ct + nz * st;
          const bz = -y1 * st + nz * ct;
          const lat = Math.asin(Math.max(-1, Math.min(1, by)));
          X[n] = Math.round(this.warpX(px, py));
          Y[n] = Math.round(this.warpY(px, py));
          V[n] = (0.5 - lat / Math.PI) * MH;
          L0[n] = Math.atan2(bx, bz);
          NX[n] = nx; NY[n] = yu; NZ[n] = nz;
          RR[n] = Math.sqrt(rr);
          ROW[n] = j;
          RND[n] = Math.floor(this.rnd() * 256);
          n += 1;
        }
      }
      this.count = n;
      this.rows = cols;
      this.cellX = X; this.cellY = Y; this.cellV = V; this.cellLon = L0;
      this.nX = NX; this.nY = NY; this.nZ = NZ; this.cellR = RR; this.cellRow = ROW; this.cellRnd = RND;
      this.rowY = new Float32Array(cols);
      for (let j = 0; j < cols; j += 1) this.rowY[j] = top + (j + 0.5) * cell;
      this.rowShift = new Float32Array(cols);
      this.rowGhost = new Uint8Array(cols);
    }

    buildFeed() {
      const rnd = seeded(0x0B0B0B);
      const hex = (len) => {
        let out = '';
        for (let i = 0; i < len; i += 1) out += '0123456789abcdef'[Math.floor(rnd() * 16)];
        return out;
      };
      let a = '';
      let b = '';
      for (let i = 0; i < 8; i += 1) {
        a += `SIM/BLK ${hex(7)}  00000000${hex(56)}   `;
        b += `SIM/TX ${hex(64)}  ML-DSA OK   `;
      }
      this.feedA = a;
      this.feedB = b;
    }

    buildStrips() {
      const fs = Math.max(8.5, Math.min(12, this.w / this.dpr * 0.019)) * this.dpr;
      const rowH = Math.ceil(fs * 1.5);
      this.feedFont = fs;
      this.feedRowH = rowH;
      this.strips = [this.feedA, this.feedB].map((text) => {
        const strip = document.createElement('canvas');
        const probe = strip.getContext('2d');
        probe.font = `700 ${fs}px ${MONO}`;
        const width = Math.ceil(probe.measureText(text).width) + 2;
        strip.width = Math.min(30000, width);
        strip.height = rowH;
        const ctx = strip.getContext('2d');
        ctx.font = `700 ${fs}px ${MONO}`;
        ctx.textBaseline = 'middle';
        ctx.fillStyle = LIME;
        ctx.fillText(text, 0, rowH / 2);
        return strip;
      });
    }

    /* ---------- events ---------- */

    glitch(now) {
      this.glitchUntil = now + 260;
      this.glitchNext = 0;
      this.glitchStart = now;
    }

    rollBands() {
      const rnd = this.rnd;
      const bands = [];
      const count = 3 + Math.floor(rnd() * 4);
      for (let i = 0; i < count; i += 1) {
        const start = Math.floor(rnd() * this.rows);
        bands.push({
          start,
          end: start + 1 + Math.floor(rnd() * Math.max(2, this.rows * 0.08)),
          dx: (rnd() < 0.5 ? -1 : 1) * (0.6 + rnd() * 4.5) * this.cell,
          ghost: rnd() < 0.55
        });
      }
      this.bands = bands;
    }

    /* ---------- frame ---------- */

    draw(now, t, phase) {
      this.last = { now, t, phase };
      const ctx = this.ctx;
      const w = this.w; const h = this.h;
      const R = this.R; const cx = this.cx; const cy = this.cy;
      const cell = this.cell; const s = this.sprite; const half = s / 2;
      const dpr = this.dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, w, h);

      /* power-on aperture: the picture opens from a horizontal line */
      const power = phase === 'static' ? 1 : Math.min(1, t / 380);
      const aperture = 1 - Math.pow(1 - power, 3);
      ctx.save();
      if (aperture < 1) {
        const ap = Math.max(1.5 * dpr, (h / 2) * aperture);
        ctx.beginPath();
        ctx.rect(0, h / 2 - ap, w, ap * 2);
        ctx.clip();
      }

      /* phosphor ambient + limb atmosphere */
      const amb = ctx.createRadialGradient(cx, cy, R * 0.2, cx, cy, R * 1.5);
      amb.addColorStop(0, 'rgba(199,255,46,0.075)');
      amb.addColorStop(0.62, 'rgba(199,255,46,0.03)');
      amb.addColorStop(1, 'rgba(199,255,46,0)');
      ctx.fillStyle = amb;
      ctx.fillRect(0, 0, w, h);
      const atm = ctx.createRadialGradient(cx, cy, R * 0.96, cx, cy, R * 1.16);
      atm.addColorStop(0, 'rgba(199,255,46,0.16)');
      atm.addColorStop(0.35, 'rgba(199,255,46,0.06)');
      atm.addColorStop(1, 'rgba(199,255,46,0)');
      ctx.fillStyle = atm;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.16, 0, TAU);
      ctx.fill();

      /* time-driven state */
      const tt = phase === 'static' ? 6000 : t;
      const rotation = this.rotation0 + tt * this.spin;
      const la = (tt - 6000) * this.lightSpeed; /* light angle: dawn breaks at 6 s */
      const el = 0.32;
      const lx = Math.sin(la) * Math.cos(el);
      const ly = Math.sin(el);
      const lz = Math.cos(la) * Math.cos(el);
      /* half vector for a phosphor hot spot */
      let hx = lx; let hy = ly; let hz = lz + 1;
      const hl = Math.hypot(hx, hy, hz); hx /= hl; hy /= hl; hz /= hl;

      const resolve = phase === 'static' ? 1 : Math.max(0, Math.min(1, (t - 260) / 1500));
      const resolveEase = resolve < 1 ? 1 - Math.pow(1 - resolve, 2) : 1;
      const boundaryRow = resolveEase * (this.rows + 3);
      const tick = Math.floor(t / 45);

      const glitching = now < this.glitchUntil;
      if (glitching) {
        if (now >= (this.glitchNext || 0)) { this.rollBands(); this.glitchNext = now + 42; }
      } else if (this.bands.length) {
        this.bands = [];
      }
      const bands = this.bands;
      const rowShift = this.rowShift;
      const rowGhost = this.rowGhost;
      rowShift.fill(0); rowGhost.fill(0);
      for (let b = 0; b < bands.length; b += 1) {
        const band = bands[b];
        for (let r = band.start; r < band.end && r < this.rows; r += 1) {
          rowShift[r] = band.dx; rowGhost[r] = band.ghost ? 1 : 0;
        }
      }

      const atlas = this.atlas;
      const count = this.count;
      const X = this.cellX; const Y = this.cellY; const V = this.cellV; const L0 = this.cellLon;
      const NX = this.nX; const NY = this.nY; const NZ = this.nZ; const RR = this.cellR;
      const ROW = this.cellRow; const RND = this.cellRnd;
      const lonScale = MW / TAU;
      const rampMax = RAMP.length - 1;
      const hexBase = this.hexBase;

      /* ocean dots are batched by alpha bucket to keep state changes cheap */
      const dotSize = Math.max(1, Math.round(dpr));
      ctx.fillStyle = LIME;

      for (let i = 0; i < count; i += 1) {
        const row = ROW[i];
        const x = X[i] + rowShift[row];
        const y = Y[i];
        const ghost = rowGhost[row];

        /* unresolved raster: hex static, then a settling band under the scan bar */
        const rowPos = boundaryRow - row;
        if (rowPos < 0) {
          if (((RND[i] + tick) & 3) === 0) continue;
          const g = hexBase + ((RND[i] + tick * (1 + (RND[i] & 3))) & 15);
          ctx.globalAlpha = 0.07 + ((RND[i] * 37 + tick * 11) & 15) / 15 * 0.16;
          ctx.drawImage(atlas, g * s, 0, s, s, x - half, y - half, s, s);
          continue;
        }
        if (rowPos < 3) {
          const g = hexBase + ((RND[i] + tick * 3) & 15);
          ctx.globalAlpha = 0.5 + ((RND[i] + tick) & 7) / 7 * 0.5;
          ctx.drawImage(atlas, g * s, s, s, s, x - half, y - half, s, s);
          continue;
        }

        /* land coverage under this cell */
        let u = (L0[i] - rotation) * lonScale + MW / 2;
        u -= Math.floor(u / MW) * MW;
        const x0 = u | 0; const x1 = x0 + 1 === MW ? 0 : x0 + 1; const fx = u - x0;
        const v = V[i];
        let y0 = v | 0; if (y0 > MH - 1) y0 = MH - 1;
        const y1 = y0 + 1 > MH - 1 ? MH - 1 : y0 + 1; const fy = v - y0;
        const r0 = y0 * MW; const r1 = y1 * MW;
        const cov = ((MASK[r0 + x0] * (1 - fx) + MASK[r0 + x1] * fx) * (1 - fy)
          + (MASK[r1 + x0] * (1 - fx) + MASK[r1 + x1] * fx) * fy) / 15;

        const nx = NX[i]; const ny = NY[i]; const nz = NZ[i];
        const ndl = nx * lx + ny * ly + nz * lz;
        const diffuse = ndl > 0 ? ndl : 0;
        const twilight = Math.exp(-(ndl * ndl) / 0.02);
        const rim = RR[i] > 0.82 ? (RR[i] - 0.82) / 0.18 : 0;
        const lit = 0.16 + 0.84 * Math.sqrt(diffuse);
        let spec = nx * hx + ny * hy + nz * hz;
        spec = spec > 0 ? spec * spec * spec * spec : 0;
        spec *= spec; spec *= spec; /* ^16 */

        if (cov < 0.07) {
          /* ocean: dot matrix that only glows on the day side and along the terminator */
          const a = 0.045 + diffuse * 0.12 + twilight * 0.34 + rim * 0.12 * lit;
          if (a < 0.05) continue;
          ctx.globalAlpha = a > 1 ? 1 : a;
          if (spec > 0.5) {
            ctx.fillStyle = WHITE;
            ctx.fillRect(x - dotSize, y - dotSize, dotSize * 2, dotSize * 2);
            ctx.fillStyle = LIME;
          } else {
            ctx.fillRect(x - dotSize / 2, y - dotSize / 2, dotSize, dotSize);
          }
          continue;
        }

        const b = cov * (0.55 + 0.45 * lit) + twilight * 0.18 * cov;
        let g = Math.round(b * rampMax);
        if (g < 1) g = 1; if (g > rampMax) g = rampMax;
        let a = (0.2 + 0.8 * lit) * (0.45 + 0.55 * cov) + rim * 0.22 + twilight * 0.25 * cov;
        if (a > 1) a = 1;
        const hot = spec > 0.62 && cov > 0.5;
        if (ghost) {
          ctx.globalAlpha = a * 0.45;
          ctx.drawImage(atlas, g * s, s, s, s, x - half - rowShift[row] * 0.6, y - half, s, s);
        }
        ctx.globalAlpha = a;
        ctx.drawImage(atlas, g * s, hot ? s : 0, s, s, x - half, y - half, s, s);
      }

      /* scan bar of the resolve pass */
      if (resolve > 0 && resolve < 1) {
        const by = this.rowY[Math.min(this.rows - 1, Math.max(0, Math.floor(boundaryRow)))];
        const bw = Math.sqrt(Math.max(0, R * R - (by - cy) * (by - cy)));
        if (bw > 0) {
          ctx.globalAlpha = 0.85;
          ctx.fillStyle = WHITE;
          ctx.fillRect(this.warpX(cx - bw, by), Math.round(this.warpY(cx, by)), bw * 2, Math.max(1, dpr));
          ctx.fillStyle = LIME;
          ctx.globalAlpha = 0.3;
          ctx.fillRect(this.warpX(cx - bw, by) - cell * 2, Math.round(this.warpY(cx, by)) + dpr, bw * 2 + cell * 4, Math.max(1, dpr * 3));
        }
      }

      /* nodes + arcs, only once the raster has settled */
      if (resolve >= 1) this.drawNetwork(ctx, now, tt, rotation);

      /* limb */
      ctx.globalAlpha = 1;
      ctx.strokeStyle = 'rgba(199,255,46,0.34)';
      ctx.lineWidth = Math.max(1, dpr * 0.8);
      ctx.beginPath();
      ctx.arc(cx, cy, R * (1 - this.K * 0.55), 0, TAU);
      ctx.stroke();

      /* phosphor bloom: downsample the frame and lay it back over itself */
      if (!this.small && this.bloomCtx) {
        const bc = this.bloomCtx; const bw = this.bloom.width; const bh = this.bloom.height;
        bc.clearRect(0, 0, bw, bh);
        bc.drawImage(this.canvas, 0, 0, bw, bh);
        ctx.globalAlpha = 0.42;
        ctx.drawImage(this.bloom, 0, 0, w, h);
        ctx.globalAlpha = 1;
      }

      /* the feed stays crisp: drawn after the bloom */
      this.drawFeed(ctx, tt, glitching);

      /* glitch tears + flash */
      if (glitching) {
        ctx.fillStyle = LIME;
        for (let b = 0; b < bands.length; b += 1) {
          const band = bands[b];
          const y = this.rowY[Math.min(this.rows - 1, band.start)] - cell / 2;
          ctx.globalAlpha = 0.5;
          ctx.fillRect(0, Math.round(y), w, Math.max(1, dpr));
        }
        if (now - this.glitchStart < 70) {
          ctx.globalAlpha = 0.07;
          ctx.fillRect(0, 0, w, h);
        }
        ctx.globalAlpha = 1;
      }

      ctx.restore();

      /* bright core while the aperture is still opening */
      if (aperture < 1) {
        ctx.globalAlpha = 1 - aperture;
        ctx.fillStyle = WHITE;
        ctx.fillRect(w * 0.06, Math.round(h / 2) - dpr, w * 0.88, dpr * 2);
        ctx.globalAlpha = (1 - aperture) * 0.5;
        ctx.fillStyle = LIME;
        ctx.fillRect(0, Math.round(h / 2) - dpr * 4, w, dpr * 8);
        ctx.globalAlpha = 1;
      }

      /* tube vignette */
      const vig = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.78);
      vig.addColorStop(0, 'rgba(11,11,11,0)');
      vig.addColorStop(1, 'rgba(11,11,11,0.7)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, w, h);
    }

    drawNetwork(ctx, now, t, rotation) {
      const cx = this.cx; const cy = this.cy; const R = this.R; const dpr = this.dpr;
      const ct = Math.cos(this.tilt); const st = Math.sin(this.tilt);
      const cr = Math.cos(this.roll); const sr = Math.sin(this.roll);
      const pts = this.nodePts || (this.nodePts = NODES.map(() => ({ x: 0, y: 0, z: 0, bx: 0, by: 0, bz: 0 })));
      for (let i = 0; i < NODES.length; i += 1) {
        const lat = NODES[i][0] * Math.PI / 180;
        const lon = NODES[i][1] * Math.PI / 180 + rotation;
        const bx = Math.cos(lat) * Math.sin(lon);
        const by = Math.sin(lat);
        const bz = Math.cos(lat) * Math.cos(lon);
        /* body -> screen: tilt about X, then roll about Z */
        const y1 = by * ct - bz * st;
        const z1 = by * st + bz * ct;
        const nx = bx * cr - y1 * sr;
        const yu = bx * sr + y1 * cr;
        const p = pts[i];
        p.x = nx; p.y = yu; p.z = z1; p.bx = bx; p.by = by; p.bz = bz;
      }
      const dot = Math.max(1, dpr);
      /* arcs as dotted great circles lifted off the surface, with one traveling pulse */
      for (let k = 0; k < LINKS.length; k += 1) {
        const a = pts[LINKS[k][0]]; const b = pts[LINKS[k][1]];
        const cosO = Math.max(-1, Math.min(1, a.x * b.x + a.y * b.y + a.z * b.z));
        const omega = Math.acos(cosO);
        if (omega < 0.02) continue;
        const so = Math.sin(omega);
        const segs = 22;
        const pulse = ((t / 1600) + k * 0.37) % 1;
        for (let j = 0; j <= segs; j += 1) {
          const f = j / segs;
          const wa = Math.sin((1 - f) * omega) / so; const wb = Math.sin(f * omega) / so;
          const lift = 1 + 0.16 * Math.sin(f * Math.PI) * omega / Math.PI * 2;
          const x = (a.x * wa + b.x * wb) * lift; const y = (a.y * wa + b.y * wb) * lift; const z = (a.z * wa + b.z * wb) * lift;
          if (z < 0.08) continue;
          const px = cx + x * R; const py = cy - y * R;
          const near = Math.abs(f - pulse);
          const p = near < 0.08 ? 1 - near / 0.08 : 0;
          ctx.globalAlpha = 0.16 + p * 0.8;
          ctx.fillStyle = p > 0.5 ? WHITE : LIME;
          const sz = dot * (1 + p);
          ctx.fillRect(Math.round(this.warpX(px, py) - sz / 2), Math.round(this.warpY(px, py) - sz / 2), sz, sz);
        }
      }
      /* node pings */
      ctx.lineWidth = Math.max(1, dpr);
      for (let i = 0; i < pts.length; i += 1) {
        const p = pts[i];
        if (p.z < 0.05) continue;
        const px = this.warpX(cx + p.x * R, cy - p.y * R);
        const py = this.warpY(cx + p.x * R, cy - p.y * R);
        const ring = ((now / 1500) + i * 0.29) % 1;
        ctx.globalAlpha = (1 - ring) * 0.7 * Math.min(1, p.z * 2);
        ctx.strokeStyle = LIME;
        ctx.beginPath();
        ctx.arc(px, py, (2 + ring * 12) * dpr, 0, TAU);
        ctx.stroke();
        ctx.globalAlpha = Math.min(1, 0.5 + p.z);
        ctx.fillStyle = WHITE;
        const sz = 3 * dpr;
        ctx.fillRect(Math.round(px - sz / 2), Math.round(py - sz / 2), sz, sz);
      }
      ctx.globalAlpha = 1;
    }

    drawFeed(ctx, t, glitching) {
      const w = this.w; const h = this.h; const dpr = this.dpr;
      const rowH = this.feedRowH;
      const top = h - rowH * 2.35;
      ctx.globalAlpha = 1;
      /* rule + caption */
      ctx.fillStyle = 'rgba(199,255,46,0.35)';
      ctx.fillRect(0, Math.round(top - rowH * 0.55), w, Math.max(1, dpr * 0.8));
      ctx.font = `700 ${Math.round(this.feedFont * 0.78)}px ${MONO}`;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'right';
      ctx.fillStyle = LIME;
      ctx.globalAlpha = 0.8;
      ctx.fillText('HASH FEED / DECORATIVE / NOT LIVE DATA', w - 10 * dpr, Math.round(top - rowH * 1.1));
      ctx.textAlign = 'left';
      ctx.globalAlpha = 0.55;
      ctx.fillText('PHOSPHOR RASTER 01', 10 * dpr, Math.round(top - rowH * 1.1));
      /* two rows, opposite directions, drawn in column chunks that follow the tube curve */
      const chunks = this.small ? 18 : 36;
      const cw = w / chunks;
      for (let r = 0; r < 2; r += 1) {
        const strip = this.strips[r];
        const sw = strip.width;
        const speed = (r === 0 ? 0.055 : -0.038) * dpr;
        let offset = (t * speed + (glitching ? (this.bands.length ? this.bands[0].dx * 2 : 0) : 0)) % sw;
        if (offset < 0) offset += sw;
        const y = top + r * rowH * 1.1;
        ctx.globalAlpha = r === 0 ? 1 : 0.66;
        for (let c = 0; c < chunks; c += 1) {
          const x0 = c * cw;
          const wx = this.warpX(x0, y); const wx1 = this.warpX(x0 + cw, y);
          const wy = this.warpY(x0 + cw / 2, y);
          let src = (offset + x0) % sw;
          const avail = sw - src;
          if (avail >= cw) {
            ctx.drawImage(strip, src, 0, cw, rowH, wx, Math.round(wy), wx1 - wx, rowH);
          } else {
            const scale = (wx1 - wx) / cw;
            ctx.drawImage(strip, src, 0, avail, rowH, wx, Math.round(wy), avail * scale, rowH);
            ctx.drawImage(strip, 0, 0, cw - avail, rowH, wx + avail * scale, Math.round(wy), (cw - avail) * scale, rowH);
          }
        }
      }
      /* fade the feed edges into the tube */
      const fade = ctx.createLinearGradient(0, 0, w, 0);
      fade.addColorStop(0, 'rgba(11,11,11,1)');
      fade.addColorStop(0.09, 'rgba(11,11,11,0)');
      fade.addColorStop(0.91, 'rgba(11,11,11,0)');
      fade.addColorStop(1, 'rgba(11,11,11,1)');
      ctx.globalAlpha = 1;
      ctx.fillStyle = fade;
      ctx.fillRect(0, Math.round(top - rowH * 0.2), w, rowH * 2.6);
    }
  }

  /* ---------- boot sequence ---------- */

  const boot = document.querySelector('[data-boot]');
  if (boot) {
    const lines = [...boot.querySelectorAll('[data-boot-line]')];
    const progress = boot.querySelector('[data-boot-progress]');
    const percent = boot.querySelector('[data-boot-percent]');
    const skip = boot.querySelector('[data-boot-skip]');
    const collapse = document.querySelector('[data-boot-collapse]');
    const canvas = boot.querySelector('[data-globe]');
    const phosphor = canvas ? Phosphor.create(canvas) : null;
    if (canvas && !phosphor) boot.classList.add('is-noglobe');
    const duration = reduceMotion ? 350 : 6000;
    const HARD_CAP = 10000;
    let finished = false;
    let animationFrame = 0;
    let shown = -1;
    const started = performance.now();

    const onKeydown = (event) => {
      if (event.key === 'Enter' || event.key === 'Escape') finish();
    };

    const finish = () => {
      if (finished) return;
      finished = true;
      document.removeEventListener('keydown', onKeydown);
      cancelAnimationFrame(animationFrame);
      window.clearTimeout(cap);
      window.clearTimeout(done);
      lines.forEach((line) => { line.classList.add('is-visible'); line.classList.remove('is-current'); });
      progress.style.width = '100%';
      percent.textContent = '100%';
      boot.classList.add('is-done');
      if (reduceMotion || !collapse) {
        document.body.classList.remove('boot-locked');
        boot.setAttribute('hidden', '');
        return;
      }
      /* cathode collapse: picture to a line, line to a dot */
      collapse.removeAttribute('hidden');
      collapse.classList.add('is-on');
      window.setTimeout(() => {
        boot.classList.add('is-dot');
        collapse.classList.add('is-dot');
      }, 340);
      window.setTimeout(() => {
        boot.setAttribute('hidden', '');
        collapse.setAttribute('hidden', '');
        document.body.classList.remove('boot-locked');
      }, 720);
    };

    /* the sequence has a fixed length on the wall clock, independent of rAF cadence */
    const cap = window.setTimeout(finish, HARD_CAP);
    const done = window.setTimeout(finish, duration + (reduceMotion ? 0 : 280));

    const tick = () => {
      if (finished) return;
      const now = performance.now();
      const t = now - started;
      const ratio = Math.min(1, t / duration);
      const value = Math.round(ratio * 100);
      progress.style.width = `${value}%`;
      percent.textContent = `${value}%`;
      let visible = 0;
      lines.forEach((line, index) => {
        const on = ratio >= index / lines.length - 0.02;
        line.classList.toggle('is-visible', on);
        if (on) visible = index + 1;
      });
      if (visible - 1 !== shown) {
        shown = visible - 1;
        lines.forEach((line, index) => line.classList.toggle('is-current', index === shown));
        if (!reduceMotion) {
          if (phosphor) phosphor.glitch(now);
          boot.classList.remove('is-glitch');
          void boot.offsetWidth;
          boot.classList.add('is-glitch');
        }
      }
      if (phosphor) phosphor.draw(now, t, reduceMotion ? 'static' : 'run');
      animationFrame = requestAnimationFrame(tick);
    };

    skip.addEventListener('click', finish);
    document.addEventListener('keydown', onKeydown);
    if (reduceMotion && phosphor) {
      /* one static frame, then finish fast */
      phosphor.draw(started, 6000, 'static');
      lines.forEach((line) => line.classList.add('is-visible'));
      progress.style.width = '100%';
      percent.textContent = '100%';
    } else {
      animationFrame = requestAnimationFrame(tick);
    }
  } else {
    document.body.classList.remove('boot-locked');
  }

  /* ---------- page helpers (same behavior as dlt-site.js) ---------- */

  const year = document.querySelector('[data-year]');
  if (year) year.textContent = String(new Date().getFullYear());

  const menu = document.querySelector('[data-mobile-menu]');
  if (menu) {
    menu.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => menu.removeAttribute('open')));
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') menu.removeAttribute('open');
    });
    document.addEventListener('click', (event) => {
      if (menu.open && !menu.contains(event.target)) menu.removeAttribute('open');
    });
  }

  const navLinks = [...document.querySelectorAll('.desktop-nav a[href^="#"]')];
  const sections = navLinks.map((link) => document.querySelector(link.getAttribute('href'))).filter(Boolean);
  if ('IntersectionObserver' in window && sections.length) {
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      navLinks.forEach((link) => {
        if (link.getAttribute('href') === `#${visible.target.id}`) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      });
    }, { rootMargin: '-24% 0px -62% 0px', threshold: [0, .2, .5] });
    sections.forEach((section) => observer.observe(section));
  }
})();
