/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./node_modules/.pnpm/dayjs@1.11.7/node_modules/dayjs/dayjs.min.js":
/*!*************************************************************************!*\
  !*** ./node_modules/.pnpm/dayjs@1.11.7/node_modules/dayjs/dayjs.min.js ***!
  \*************************************************************************/
/***/ (function(module) {

!function(t,e){ true?module.exports=e():0}(this,(function(){"use strict";var t=1e3,e=6e4,n=36e5,r="millisecond",i="second",s="minute",u="hour",a="day",o="week",f="month",h="quarter",c="year",d="date",l="Invalid Date",$=/^(\d{4})[-/]?(\d{1,2})?[-/]?(\d{0,2})[Tt\s]*(\d{1,2})?:?(\d{1,2})?:?(\d{1,2})?[.:]?(\d+)?$/,y=/\[([^\]]+)]|Y{1,4}|M{1,4}|D{1,2}|d{1,4}|H{1,2}|h{1,2}|a|A|m{1,2}|s{1,2}|Z{1,2}|SSS/g,M={name:"en",weekdays:"Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"),months:"January_February_March_April_May_June_July_August_September_October_November_December".split("_"),ordinal:function(t){var e=["th","st","nd","rd"],n=t%100;return"["+t+(e[(n-20)%10]||e[n]||e[0])+"]"}},m=function(t,e,n){var r=String(t);return!r||r.length>=e?t:""+Array(e+1-r.length).join(n)+t},v={s:m,z:function(t){var e=-t.utcOffset(),n=Math.abs(e),r=Math.floor(n/60),i=n%60;return(e<=0?"+":"-")+m(r,2,"0")+":"+m(i,2,"0")},m:function t(e,n){if(e.date()<n.date())return-t(n,e);var r=12*(n.year()-e.year())+(n.month()-e.month()),i=e.clone().add(r,f),s=n-i<0,u=e.clone().add(r+(s?-1:1),f);return+(-(r+(n-i)/(s?i-u:u-i))||0)},a:function(t){return t<0?Math.ceil(t)||0:Math.floor(t)},p:function(t){return{M:f,y:c,w:o,d:a,D:d,h:u,m:s,s:i,ms:r,Q:h}[t]||String(t||"").toLowerCase().replace(/s$/,"")},u:function(t){return void 0===t}},g="en",D={};D[g]=M;var p=function(t){return t instanceof _},S=function t(e,n,r){var i;if(!e)return g;if("string"==typeof e){var s=e.toLowerCase();D[s]&&(i=s),n&&(D[s]=n,i=s);var u=e.split("-");if(!i&&u.length>1)return t(u[0])}else{var a=e.name;D[a]=e,i=a}return!r&&i&&(g=i),i||!r&&g},w=function(t,e){if(p(t))return t.clone();var n="object"==typeof e?e:{};return n.date=t,n.args=arguments,new _(n)},O=v;O.l=S,O.i=p,O.w=function(t,e){return w(t,{locale:e.$L,utc:e.$u,x:e.$x,$offset:e.$offset})};var _=function(){function M(t){this.$L=S(t.locale,null,!0),this.parse(t)}var m=M.prototype;return m.parse=function(t){this.$d=function(t){var e=t.date,n=t.utc;if(null===e)return new Date(NaN);if(O.u(e))return new Date;if(e instanceof Date)return new Date(e);if("string"==typeof e&&!/Z$/i.test(e)){var r=e.match($);if(r){var i=r[2]-1||0,s=(r[7]||"0").substring(0,3);return n?new Date(Date.UTC(r[1],i,r[3]||1,r[4]||0,r[5]||0,r[6]||0,s)):new Date(r[1],i,r[3]||1,r[4]||0,r[5]||0,r[6]||0,s)}}return new Date(e)}(t),this.$x=t.x||{},this.init()},m.init=function(){var t=this.$d;this.$y=t.getFullYear(),this.$M=t.getMonth(),this.$D=t.getDate(),this.$W=t.getDay(),this.$H=t.getHours(),this.$m=t.getMinutes(),this.$s=t.getSeconds(),this.$ms=t.getMilliseconds()},m.$utils=function(){return O},m.isValid=function(){return!(this.$d.toString()===l)},m.isSame=function(t,e){var n=w(t);return this.startOf(e)<=n&&n<=this.endOf(e)},m.isAfter=function(t,e){return w(t)<this.startOf(e)},m.isBefore=function(t,e){return this.endOf(e)<w(t)},m.$g=function(t,e,n){return O.u(t)?this[e]:this.set(n,t)},m.unix=function(){return Math.floor(this.valueOf()/1e3)},m.valueOf=function(){return this.$d.getTime()},m.startOf=function(t,e){var n=this,r=!!O.u(e)||e,h=O.p(t),l=function(t,e){var i=O.w(n.$u?Date.UTC(n.$y,e,t):new Date(n.$y,e,t),n);return r?i:i.endOf(a)},$=function(t,e){return O.w(n.toDate()[t].apply(n.toDate("s"),(r?[0,0,0,0]:[23,59,59,999]).slice(e)),n)},y=this.$W,M=this.$M,m=this.$D,v="set"+(this.$u?"UTC":"");switch(h){case c:return r?l(1,0):l(31,11);case f:return r?l(1,M):l(0,M+1);case o:var g=this.$locale().weekStart||0,D=(y<g?y+7:y)-g;return l(r?m-D:m+(6-D),M);case a:case d:return $(v+"Hours",0);case u:return $(v+"Minutes",1);case s:return $(v+"Seconds",2);case i:return $(v+"Milliseconds",3);default:return this.clone()}},m.endOf=function(t){return this.startOf(t,!1)},m.$set=function(t,e){var n,o=O.p(t),h="set"+(this.$u?"UTC":""),l=(n={},n[a]=h+"Date",n[d]=h+"Date",n[f]=h+"Month",n[c]=h+"FullYear",n[u]=h+"Hours",n[s]=h+"Minutes",n[i]=h+"Seconds",n[r]=h+"Milliseconds",n)[o],$=o===a?this.$D+(e-this.$W):e;if(o===f||o===c){var y=this.clone().set(d,1);y.$d[l]($),y.init(),this.$d=y.set(d,Math.min(this.$D,y.daysInMonth())).$d}else l&&this.$d[l]($);return this.init(),this},m.set=function(t,e){return this.clone().$set(t,e)},m.get=function(t){return this[O.p(t)]()},m.add=function(r,h){var d,l=this;r=Number(r);var $=O.p(h),y=function(t){var e=w(l);return O.w(e.date(e.date()+Math.round(t*r)),l)};if($===f)return this.set(f,this.$M+r);if($===c)return this.set(c,this.$y+r);if($===a)return y(1);if($===o)return y(7);var M=(d={},d[s]=e,d[u]=n,d[i]=t,d)[$]||1,m=this.$d.getTime()+r*M;return O.w(m,this)},m.subtract=function(t,e){return this.add(-1*t,e)},m.format=function(t){var e=this,n=this.$locale();if(!this.isValid())return n.invalidDate||l;var r=t||"YYYY-MM-DDTHH:mm:ssZ",i=O.z(this),s=this.$H,u=this.$m,a=this.$M,o=n.weekdays,f=n.months,h=function(t,n,i,s){return t&&(t[n]||t(e,r))||i[n].slice(0,s)},c=function(t){return O.s(s%12||12,t,"0")},d=n.meridiem||function(t,e,n){var r=t<12?"AM":"PM";return n?r.toLowerCase():r},$={YY:String(this.$y).slice(-2),YYYY:this.$y,M:a+1,MM:O.s(a+1,2,"0"),MMM:h(n.monthsShort,a,f,3),MMMM:h(f,a),D:this.$D,DD:O.s(this.$D,2,"0"),d:String(this.$W),dd:h(n.weekdaysMin,this.$W,o,2),ddd:h(n.weekdaysShort,this.$W,o,3),dddd:o[this.$W],H:String(s),HH:O.s(s,2,"0"),h:c(1),hh:c(2),a:d(s,u,!0),A:d(s,u,!1),m:String(u),mm:O.s(u,2,"0"),s:String(this.$s),ss:O.s(this.$s,2,"0"),SSS:O.s(this.$ms,3,"0"),Z:i};return r.replace(y,(function(t,e){return e||$[t]||i.replace(":","")}))},m.utcOffset=function(){return 15*-Math.round(this.$d.getTimezoneOffset()/15)},m.diff=function(r,d,l){var $,y=O.p(d),M=w(r),m=(M.utcOffset()-this.utcOffset())*e,v=this-M,g=O.m(this,M);return g=($={},$[c]=g/12,$[f]=g,$[h]=g/3,$[o]=(v-m)/6048e5,$[a]=(v-m)/864e5,$[u]=v/n,$[s]=v/e,$[i]=v/t,$)[y]||v,l?g:O.a(g)},m.daysInMonth=function(){return this.endOf(f).$D},m.$locale=function(){return D[this.$L]},m.locale=function(t,e){if(!t)return this.$L;var n=this.clone(),r=S(t,e,!0);return r&&(n.$L=r),n},m.clone=function(){return O.w(this.$d,this)},m.toDate=function(){return new Date(this.valueOf())},m.toJSON=function(){return this.isValid()?this.toISOString():null},m.toISOString=function(){return this.$d.toISOString()},m.toString=function(){return this.$d.toUTCString()},M}(),T=_.prototype;return w.prototype=T,[["$ms",r],["$s",i],["$m",s],["$H",u],["$W",a],["$M",f],["$y",c],["$D",d]].forEach((function(t){T[t[1]]=function(e){return this.$g(e,t[0],t[1])}})),w.extend=function(t,e){return t.$i||(t(e,_,w),t.$i=!0),w},w.locale=S,w.isDayjs=p,w.unix=function(t){return w(1e3*t)},w.en=D[g],w.Ls=D,w.p={},w}));

/***/ }),

/***/ "./src/content/button.ts":
/*!*******************************!*\
  !*** ./src/content/button.ts ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "addCustomBtn": () => (/* binding */ addCustomBtn)
/* harmony export */ });
/* harmony import */ var _post__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./post */ "./src/content/post.ts");
/* harmony import */ var _postDetail__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./postDetail */ "./src/content/postDetail.ts");
/* harmony import */ var _profile__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./profile */ "./src/content/profile.ts");
/* harmony import */ var _stories__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./stories */ "./src/content/stories.ts");




var svgDownloadBtn = `<svg version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" height="24" width="24"
viewBox="0 0 477.867 477.867" style="fill:%color;" xml:space="preserve">
<g>
	 <path d="M443.733,307.2c-9.426,0-17.067,7.641-17.067,17.067v102.4c0,9.426-7.641,17.067-17.067,17.067H68.267
			 c-9.426,0-17.067-7.641-17.067-17.067v-102.4c0-9.426-7.641-17.067-17.067-17.067s-17.067,7.641-17.067,17.067v102.4
			 c0,28.277,22.923,51.2,51.2,51.2H409.6c28.277,0,51.2-22.923,51.2-51.2v-102.4C460.8,314.841,453.159,307.2,443.733,307.2z"/>
</g>
<g>
	 <path d="M335.947,295.134c-6.614-6.387-17.099-6.387-23.712,0L256,351.334V17.067C256,7.641,248.359,0,238.933,0
			 s-17.067,7.641-17.067,17.067v334.268l-56.201-56.201c-6.78-6.548-17.584-6.36-24.132,0.419c-6.388,6.614-6.388,17.099,0,23.713
			 l85.333,85.333c6.657,6.673,17.463,6.687,24.136,0.031c0.01-0.01,0.02-0.02,0.031-0.031l85.333-85.333
			 C342.915,312.486,342.727,301.682,335.947,295.134z"/>
</g>
</svg>`;
var svgNewtabBtn = `<svg id="Capa_1" style="fill:%color;" viewBox="0 0 482.239 482.239" xmlns="http://www.w3.org/2000/svg" height="24" width="24">
<path d="m465.016 0h-344.456c-9.52 0-17.223 7.703-17.223 17.223v86.114h-86.114c-9.52 0-17.223 7.703-17.223 17.223v344.456c0 9.52 7.703 17.223 17.223 17.223h344.456c9.52 0 17.223-7.703 17.223-17.223v-86.114h86.114c9.52 0 17.223-7.703 17.223-17.223v-344.456c0-9.52-7.703-17.223-17.223-17.223zm-120.56 447.793h-310.01v-310.01h310.011v310.01zm103.337-103.337h-68.891v-223.896c0-9.52-7.703-17.223-17.223-17.223h-223.896v-68.891h310.011v310.01z"/>
</svg>`;
function onClickHandler(e) {
    var _a;
    // handle button click
    e.stopPropagation();
    e.preventDefault();
    const { currentTarget } = e;
    if (currentTarget instanceof HTMLAnchorElement) {
        const pathPrefix = window.location.pathname;
        if (pathPrefix.startsWith('/stories/')) {
            (0,_stories__WEBPACK_IMPORTED_MODULE_3__.storyOnClicked)(currentTarget);
        }
        else if (pathPrefix.startsWith('/reel/')) {
            (0,_postDetail__WEBPACK_IMPORTED_MODULE_1__.postDetailOnClicked)(currentTarget);
        }
        else if ((_a = document.querySelector('header')) === null || _a === void 0 ? void 0 : _a.contains(currentTarget)) {
            (0,_profile__WEBPACK_IMPORTED_MODULE_2__.profileOnClicked)(currentTarget);
        }
        else if (pathPrefix.startsWith('/p/')) {
            if (document.querySelector('article')) {
                (0,_post__WEBPACK_IMPORTED_MODULE_0__.postOnClicked)(currentTarget);
            }
            else {
                (0,_postDetail__WEBPACK_IMPORTED_MODULE_1__.postDetailOnClicked)(currentTarget);
            }
        }
        else {
            (0,_post__WEBPACK_IMPORTED_MODULE_0__.postOnClicked)(currentTarget);
        }
    }
}
function createCustomBtn(svg, iconColor, className, marginLeft) {
    const newBtn = document.createElement('a');
    newBtn.innerHTML = svg.replace('%color', iconColor);
    newBtn.className = 'custom-btn ' + className;
    newBtn.setAttribute('target', '_blank');
    newBtn.setAttribute('style', 'cursor: pointer;margin-left:' + marginLeft + 'px;margin-top: 8px;z-index: 999;');
    if (className === 'newtab-btn') {
        newBtn.setAttribute('title', 'Open in new tab');
    }
    else {
        newBtn.setAttribute('title', 'Download');
    }
    newBtn.addEventListener('click', onClickHandler);
    return newBtn;
}
function addCustomBtn(node, iconColor) {
    const newtabBtn = createCustomBtn(svgNewtabBtn, iconColor, 'newtab-btn', 16);
    node.appendChild(newtabBtn);
    const downloadBtn = createCustomBtn(svgDownloadBtn, iconColor, 'download-btn', 14);
    node.appendChild(downloadBtn);
}


/***/ }),

/***/ "./src/content/post.ts":
/*!*****************************!*\
  !*** ./src/content/post.ts ***!
  \*****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "postOnClicked": () => (/* binding */ postOnClicked)
/* harmony export */ });
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./utils */ "./src/content/utils.ts");
var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};

function postGetArticleNode(target) {
    let articleNode = target;
    while (articleNode.tagName !== 'ARTICLE') {
        articleNode = articleNode.parentNode;
    }
    return articleNode;
}
function fetchVideoURL(articleNode, videoElem) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const poster = videoElem.getAttribute('poster');
        const timeNodes = articleNode.querySelectorAll('time');
        const posterUrl = timeNodes[timeNodes.length - 1].parentNode.parentNode.href;
        const posterPattern = /\/([^\/?]*)\?/;
        const posterMatch = poster === null || poster === void 0 ? void 0 : poster.match(posterPattern);
        const postFileName = posterMatch === null || posterMatch === void 0 ? void 0 : posterMatch[1];
        const resp = yield fetch(posterUrl);
        const content = yield resp.text();
        const pattern = new RegExp(`${postFileName}.*?video_versions.*?url":("[^"]*")`, 's');
        const match = content.match(pattern);
        let videoUrl = JSON.parse((_a = match === null || match === void 0 ? void 0 : match[1]) !== null && _a !== void 0 ? _a : '');
        videoUrl = videoUrl.replace(/^(?:https?:\/\/)?(?:[^@\/\n]+@)?(?:www\.)?([^:\/?\n]+)/g, 'https://scontent.cdninstagram.com');
        videoElem.setAttribute('videoURL', videoUrl);
        return videoUrl;
    });
}
const getVideoSrc = (articleNode, videoElem) => __awaiter(void 0, void 0, void 0, function* () {
    let url = videoElem.getAttribute('src');
    if (videoElem.hasAttribute('videoURL')) {
        url = videoElem.getAttribute('videoURL');
    }
    else if (url === null || url.includes('blob')) {
        url = yield fetchVideoURL(articleNode, videoElem);
    }
    return url;
});
function postGetUrl(articleNode) {
    return __awaiter(this, void 0, void 0, function* () {
        // meta[property="og:video"]
        let url = null;
        let mediaIndex = 0;
        if (articleNode.querySelectorAll('li[style][class]').length === 0) {
            // single img or video
            url = yield (0,_utils__WEBPACK_IMPORTED_MODULE_0__.getUrlFromInfoApi)(articleNode);
            if (url === null) {
                const videoElem = articleNode.querySelector('article  div > video');
                const imgElem = articleNode.querySelector('article  div[role] div > img');
                if (videoElem) {
                    // media type is video
                    if (videoElem) {
                        url = yield getVideoSrc(articleNode, videoElem);
                    }
                }
                else if (imgElem) {
                    // media type is image
                    url = imgElem.getAttribute('src');
                }
                else {
                    console.log('Err: not find media at handle post single');
                }
            }
        }
        else {
            // multiple imgs or videos
            const isPostView = window.location.pathname.startsWith('/p/');
            let dotsList;
            if (isPostView) {
                dotsList = articleNode.querySelectorAll(`:scope > div > div > div > div:nth-child(2)>div`);
            }
            else {
                dotsList = articleNode.querySelectorAll(`:scope > div > div:nth-child(2) > div >div>div> div>div:nth-child(2)>div`);
            }
            // if get dots list fail, try get img url from img element attribute
            if (dotsList.length === 0) {
                const imgList = articleNode.querySelectorAll(':scope li img');
                if (imgList.length === 2) {
                    return imgList[0].getAttribute('src');
                }
                else if (imgList.length === 3) {
                    return imgList[1].getAttribute('src');
                }
                else if (imgList.length > 3) {
                    return imgList[imgList.length - 3].getAttribute('src');
                }
                else {
                    return null;
                }
            }
            mediaIndex = [...dotsList].findIndex((i) => i.classList.length === 2);
            url = yield (0,_utils__WEBPACK_IMPORTED_MODULE_0__.getUrlFromInfoApi)(articleNode, mediaIndex);
            if (url === null) {
                const listElements = [
                    ...articleNode.querySelectorAll(`:scope > div > div:nth-child(${isPostView ? 1 : 2}) > div > div:nth-child(1) ul li[style*="translateX"]`),
                ];
                const listElementWidth = Math.max(...listElements.map((element) => element.clientWidth));
                const positionsMap = listElements.reduce((result, element) => {
                    var _a;
                    const position = Math.round(Number((_a = element.style.transform.match(/-?(\d+)/)) === null || _a === void 0 ? void 0 : _a[1]) / listElementWidth);
                    return Object.assign(Object.assign({}, result), { [position]: element });
                }, {});
                const node = positionsMap[mediaIndex];
                const videoElem = node.querySelector('video');
                const imgElem = node.querySelector('img');
                if (videoElem) {
                    // media type is video
                    url = yield getVideoSrc(articleNode, videoElem);
                }
                else if (imgElem) {
                    // media type is image
                    url = imgElem.getAttribute('src');
                }
            }
        }
        return url;
    });
}
function postOnClicked(target) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // extract url from target post and download or open it
            const articleNode = postGetArticleNode(target);
            const url = yield postGetUrl(articleNode);
            console.log('url', url);
            // download or open media url
            if (url && url.length > 0) {
                if (target.className.includes('download-btn')) {
                    (0,_utils__WEBPACK_IMPORTED_MODULE_0__.handleUrlDownload)(url, articleNode);
                }
                else {
                    // open url in new tab
                    (0,_utils__WEBPACK_IMPORTED_MODULE_0__.openInNewTab)(url);
                }
            }
        }
        catch (e) {
            alert('get media failed!');
            console.log(`Uncatched in postOnClicked(): ${e}\n${e.stack}`);
            return null;
        }
    });
}


/***/ }),

/***/ "./src/content/postDetail.ts":
/*!***********************************!*\
  !*** ./src/content/postDetail.ts ***!
  \***********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "postDetailOnClicked": () => (/* binding */ postDetailOnClicked)
/* harmony export */ });
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./utils */ "./src/content/utils.ts");
var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};

function postGetArticleNode(target) {
    let articleNode = target;
    while (articleNode.tagName !== 'ARTICLE') {
        articleNode = articleNode.parentNode;
    }
    return articleNode;
}
function fetchVideoURL(articleNode, videoElem) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const poster = videoElem.getAttribute('poster');
        const timeNodes = articleNode.querySelectorAll('time');
        const posterUrl = timeNodes[timeNodes.length - 1].parentNode.parentNode.href;
        const posterPattern = /\/([^\/?]*)\?/;
        const posterMatch = poster === null || poster === void 0 ? void 0 : poster.match(posterPattern);
        const postFileName = posterMatch === null || posterMatch === void 0 ? void 0 : posterMatch[1];
        const resp = yield fetch(posterUrl);
        const content = yield resp.text();
        const pattern = new RegExp(`${postFileName}.*?video_versions.*?url":("[^"]*")`, 's');
        const match = content.match(pattern);
        let videoUrl = JSON.parse((_a = match === null || match === void 0 ? void 0 : match[1]) !== null && _a !== void 0 ? _a : '');
        videoUrl = videoUrl.replace(/^(?:https?:\/\/)?(?:[^@\/\n]+@)?(?:www\.)?([^:\/?\n]+)/g, 'https://scontent.cdninstagram.com');
        videoElem.setAttribute('videoURL', videoUrl);
        return videoUrl;
    });
}
const getVideoSrc = (articleNode, videoElem) => __awaiter(void 0, void 0, void 0, function* () {
    let url = videoElem.getAttribute('src');
    if (videoElem.hasAttribute('videoURL')) {
        url = videoElem.getAttribute('videoURL');
    }
    else if (url === null || url.includes('blob')) {
        url = yield fetchVideoURL(articleNode, videoElem);
    }
    return url;
});
function postGetUrl() {
    return __awaiter(this, void 0, void 0, function* () {
        // meta[property="og:video"]
        const articleNode = document.querySelector('section main');
        if (!articleNode)
            return;
        const list = articleNode.querySelectorAll('li[style][class]');
        let url = null;
        if (list.length === 0) {
            // single img or video
            url = yield (0,_utils__WEBPACK_IMPORTED_MODULE_0__.getUrlFromInfoApi)(articleNode);
            if (url === null) {
                const videoElem = articleNode.querySelector('article  div > video');
                const imgElem = articleNode.querySelector('article  div[role] div > img');
                if (videoElem) {
                    // media type is video
                    if (videoElem) {
                        url = yield getVideoSrc(articleNode, videoElem);
                    }
                }
                else if (imgElem) {
                    // media type is image
                    url = imgElem.getAttribute('src');
                }
                else {
                    console.log('Err: not find media at handle post single');
                }
            }
        }
        else {
            // multiple imgs or videos
            const isPostView = location.pathname.startsWith('/p/');
            const dotsList = articleNode.querySelectorAll(`:scope > div > div > div > div>div>div>div>div>div>div:nth-of-type(2)>div`);
            const mediaIndex = [...dotsList].findIndex((i) => i.classList.length === 2);
            url = yield (0,_utils__WEBPACK_IMPORTED_MODULE_0__.getUrlFromInfoApi)(articleNode, mediaIndex);
            if (url === null) {
                const listElements = [
                    ...articleNode.querySelectorAll(`:scope > div > div:nth-child(${isPostView ? 1 : 2}) > div > div:nth-child(1) ul li[style*="translateX"]`),
                ];
                const listElementWidth = Math.max(...listElements.map((element) => element.clientWidth));
                const positionsMap = listElements.reduce((result, element) => {
                    var _a;
                    const position = Math.round(Number((_a = element.style.transform.match(/-?(\d+)/)) === null || _a === void 0 ? void 0 : _a[1]) / listElementWidth);
                    return Object.assign(Object.assign({}, result), { [position]: element });
                }, {});
                const node = positionsMap[mediaIndex];
                const videoElem = node.querySelector('video');
                const imgElem = node.querySelector('img');
                if (videoElem) {
                    // media type is video
                    url = yield getVideoSrc(articleNode, videoElem);
                }
                else if (imgElem) {
                    // media type is image
                    url = imgElem.getAttribute('src');
                }
            }
        }
        return url;
    });
}
function postDetailOnClicked(target) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const url = yield postGetUrl();
            console.log('url', url);
            // download or open media url
            if (url && url.length > 0) {
                if (target.className.includes('download-btn')) {
                    (0,_utils__WEBPACK_IMPORTED_MODULE_0__.handleUrlDownload)(url, document.querySelector('section main'));
                }
                else {
                    // open url in new tab
                    (0,_utils__WEBPACK_IMPORTED_MODULE_0__.openInNewTab)(url);
                }
            }
        }
        catch (e) {
            alert('Download Failed!');
            console.log(`Uncatched in postDetailOnClicked(): ${e}\n${e.stack}`);
            return null;
        }
    });
}


/***/ }),

/***/ "./src/content/profile.ts":
/*!********************************!*\
  !*** ./src/content/profile.ts ***!
  \********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "profileOnClicked": () => (/* binding */ profileOnClicked)
/* harmony export */ });
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./utils */ "./src/content/utils.ts");

function profileGetUrl(target) {
    const img = document.querySelector('header img');
    const url = img.getAttribute('src');
    return url;
}
function profileOnClicked(target) {
    // extract profile picture url and download or open it
    const url = profileGetUrl(target);
    if (url && url.length > 0) {
        // check url
        if (target.getAttribute('class').includes('download-btn')) {
            // generate filename
            const filename = document.querySelector('header h2').textContent;
            (0,_utils__WEBPACK_IMPORTED_MODULE_0__.downloadResource)(url, filename);
        }
        else {
            // open url in new tab
            (0,_utils__WEBPACK_IMPORTED_MODULE_0__.openInNewTab)(url);
        }
    }
}


/***/ }),

/***/ "./src/content/stories.ts":
/*!********************************!*\
  !*** ./src/content/stories.ts ***!
  \********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "storyOnClicked": () => (/* binding */ storyOnClicked)
/* harmony export */ });
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./utils */ "./src/content/utils.ts");
var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};

function storyGetSectionNode(target) {
    let sectionNode = target;
    while (sectionNode && sectionNode.tagName !== 'SECTION') {
        sectionNode = sectionNode.parentNode;
    }
    return sectionNode;
}
function storyGetUrl(target, sectionNode) {
    return __awaiter(this, void 0, void 0, function* () {
        let url = null;
        url = yield (0,_utils__WEBPACK_IMPORTED_MODULE_0__.getUrlFromInfoApi)(target);
        if (!url) {
            if (sectionNode.querySelector('video > source')) {
                url = sectionNode.querySelector('video > source').getAttribute('src');
            }
            else if (sectionNode.querySelector('img[decoding="sync"]')) {
                const img = sectionNode.querySelector('img[decoding="sync"]');
                url = img.srcset.split(/ \d+w/g)[0].trim(); // extract first src from srcset attr. of img
                if (url && url.length > 0) {
                    return url;
                }
                url = sectionNode.querySelector('img[decoding="sync"]').getAttribute('src');
            }
            else if (sectionNode.querySelector('video')) {
                url = sectionNode.querySelector('video').getAttribute('src');
            }
        }
        return url;
    });
}
function storyOnClicked(target) {
    return __awaiter(this, void 0, void 0, function* () {
        // extract url from target story and download or open it
        const sectionNode = storyGetSectionNode(target);
        const url = yield storyGetUrl(target, sectionNode);
        if (url && url.length > 0) {
            if (target.className.includes('download-btn')) {
                (0,_utils__WEBPACK_IMPORTED_MODULE_0__.handleUrlDownload)(url, sectionNode);
            }
            else {
                // open url in new tab
                (0,_utils__WEBPACK_IMPORTED_MODULE_0__.openInNewTab)(url);
            }
        }
    });
}


/***/ }),

/***/ "./src/content/utils.ts":
/*!******************************!*\
  !*** ./src/content/utils.ts ***!
  \******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "downloadResource": () => (/* binding */ downloadResource),
/* harmony export */   "getUrlFromInfoApi": () => (/* binding */ getUrlFromInfoApi),
/* harmony export */   "handleUrlDownload": () => (/* binding */ handleUrlDownload),
/* harmony export */   "openInNewTab": () => (/* binding */ openInNewTab)
/* harmony export */ });
/* harmony import */ var dayjs__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! dayjs */ "./node_modules/.pnpm/dayjs@1.11.7/node_modules/dayjs/dayjs.min.js");
/* harmony import */ var dayjs__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(dayjs__WEBPACK_IMPORTED_MODULE_0__);
var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};

function openInNewTab(url) {
    window.open(url);
}
function forceDownload(blob, filename, extension) {
    // ref: https://stackoverflow.com/questions/49474775/chrome-65-blocks-cross-origin-a-download-client-side-workaround-to-force-down
    var a = document.createElement('a');
    a.download = filename + '.' + extension;
    a.href = blob;
    // For Firefox https://stackoverflow.com/a/32226068
    document.body.appendChild(a);
    a.click();
    a.remove();
}
// Current blob size limit is around 500MB for browsers
function downloadResource(url, filename) {
    if (url.startsWith('blob:')) {
        forceDownload(url, filename, 'mp4');
        return;
    }
    console.log(`Dowloading ${url}`);
    // ref: https://stackoverflow.com/questions/49474775/chrome-65-blocks-cross-origin-a-download-client-side-workaround-to-force-down
    if (!filename) {
        filename = url.split('\\').pop().split('/').pop();
    }
    fetch(url, {
        headers: new Headers({
            Origin: location.origin,
        }),
        mode: 'cors',
    })
        .then((response) => response.blob())
        .then((blob) => {
        const extension = blob.type.split('/').pop();
        const blobUrl = window.URL.createObjectURL(blob);
        forceDownload(blobUrl, filename, extension);
    })
        .catch((e) => console.error(e));
}
const mediaInfoCache = new Map(); // key: media id, value: info json
const mediaIdCache = new Map(); // key: post id, value: media id
const findAppId = () => {
    const appIdPattern = /"X-IG-App-ID":"([\d]+)"/;
    const bodyScripts = document.querySelectorAll('body > script');
    for (let i = 0; i < bodyScripts.length; ++i) {
        const match = bodyScripts[i].text.match(appIdPattern);
        if (match)
            return match[1];
    }
    console.log('Cannot find app id');
    return null;
};
function findPostId(articleNode) {
    const postIdPattern = /^\/p\/([^/]+)\//;
    const aNodes = articleNode.querySelectorAll('a');
    for (let i = 0; i < aNodes.length; ++i) {
        const link = aNodes[i].getAttribute('href');
        if (link) {
            const match = link.match(postIdPattern);
            if (match)
                return match[1];
        }
    }
    return null;
}
const findMediaId = (articleNode) => __awaiter(void 0, void 0, void 0, function* () {
    const mediaIdPattern = /instagram:\/\/media\?id=(\d+)|["' ]media_id["' ]:["' ](\d+)["' ]/;
    const match = window.location.href.match(/www.instagram.com\/stories\/[^\/]+\/(\d+)/);
    if (match)
        return match[1];
    const postId = findPostId(articleNode);
    if (!postId) {
        console.log('Cannot find post id');
        return null;
    }
    if (!mediaIdCache.has(postId)) {
        const postUrl = `https://www.instagram.com/p/${postId}/`;
        const resp = yield fetch(postUrl);
        const text = yield resp.text();
        const idMatch = text.match(mediaIdPattern);
        if (!idMatch)
            return null;
        let mediaId = null;
        for (let i = 0; i < idMatch.length; ++i) {
            if (idMatch[i])
                mediaId = idMatch[i];
        }
        if (!mediaId)
            return null;
        mediaIdCache.set(postId, mediaId);
    }
    return mediaIdCache.get(postId);
});
const getImgOrVedioUrl = (item) => {
    if ('video_versions' in item) {
        return item.video_versions[0].url;
    }
    else {
        return item.image_versions2.candidates[0].url;
    }
};
const getUrlFromInfoApi = (articleNode, mediaIdx = 0) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const appId = findAppId();
        if (!appId) {
            console.log('Cannot find appid');
            return null;
        }
        const mediaId = yield findMediaId(articleNode);
        if (!mediaId) {
            console.log('Cannot find media id');
            return null;
        }
        if (!mediaInfoCache.has(mediaId)) {
            const url = 'https://i.instagram.com/api/v1/media/' + mediaId + '/info/';
            const resp = yield fetch(url, {
                method: 'GET',
                headers: {
                    Accept: '*/*',
                    'X-IG-App-ID': appId,
                },
                credentials: 'include',
                mode: 'cors',
            });
            if (resp.status !== 200) {
                console.log(`Fetch info API failed with status code: ${resp.status}`);
                return null;
            }
            const respJson = yield resp.json();
            mediaInfoCache.set(mediaId, respJson);
        }
        const infoJson = mediaInfoCache.get(mediaId);
        if ('carousel_media' in infoJson.items[0]) {
            // multi-media post
            return getImgOrVedioUrl(infoJson.items[0].carousel_media[mediaIdx]);
        }
        else {
            // single media post
            return getImgOrVedioUrl(infoJson.items[0]);
        }
    }
    catch (e) {
        console.log(`Uncatched in getUrlFromInfoApi(): ${e}\n${e.stack}`);
        return null;
    }
});
const handleUrlDownload = (url, node) => {
    var _a;
    let mediaName = url.split('?')[0].split('\\').pop().split('/').pop();
    mediaName = mediaName.substring(0, mediaName.lastIndexOf('.'));
    const postTime = (_a = node.querySelector('time')) === null || _a === void 0 ? void 0 : _a.getAttribute('datetime');
    const posterName = node.querySelector('header a').getAttribute('href').replace(/\//g, '');
    downloadResource(url, posterName + '-' + dayjs__WEBPACK_IMPORTED_MODULE_0___default()(postTime).format('YYYYMMDD_HHmmss') + '-' + mediaName);
};



/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be in strict mode.
(() => {
"use strict";
/*!******************************!*\
  !*** ./src/content/index.ts ***!
  \******************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _button__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./button */ "./src/content/button.ts");

setInterval(() => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
    if (window.location.origin !== 'https://www.instagram.com')
        return;
    const iconColor = getComputedStyle(document.body).backgroundColor === 'rgb(0, 0, 0)' ? 'white' : 'black';
    // home
    if (window.location.pathname === '/') {
        const articleList = document.querySelectorAll('article');
        for (let i = 0; i < articleList.length; i++) {
            const shareButton = articleList[i].querySelector('button svg polygon[points="11.698 20.334 22 3.001 2 3.001 9.218 10.084 11.698 20.334"]');
            if (shareButton && articleList[i].getElementsByClassName('custom-btn').length === 0) {
                (0,_button__WEBPACK_IMPORTED_MODULE_0__.addCustomBtn)((_c = (_b = (_a = shareButton.parentNode) === null || _a === void 0 ? void 0 : _a.parentNode) === null || _b === void 0 ? void 0 : _b.parentNode) === null || _c === void 0 ? void 0 : _c.parentNode, iconColor);
            }
        }
    }
    // post
    if (window.location.pathname.startsWith('/p/')) {
        const btns = document.querySelector('div[role="presentation"] section') ||
            ((_g = (_f = (_e = (_d = document.querySelector('button svg polygon[points="11.698 20.334 22 3.001 2 3.001 9.218 10.084 11.698 20.334"]')) === null || _d === void 0 ? void 0 : _d.parentNode) === null || _e === void 0 ? void 0 : _e.parentNode) === null || _f === void 0 ? void 0 : _f.parentNode) === null || _g === void 0 ? void 0 : _g.parentNode);
        if (btns && btns.getElementsByClassName('custom-btn').length === 0) {
            (0,_button__WEBPACK_IMPORTED_MODULE_0__.addCustomBtn)(btns, iconColor);
        }
    }
    // stories
    if (window.location.pathname.startsWith('/stories/')) {
        const storyBtn = document.querySelector('section section svg circle');
        if (storyBtn && document.getElementsByClassName('custom-btn').length === 0) {
            (0,_button__WEBPACK_IMPORTED_MODULE_0__.addCustomBtn)((_l = (_k = (_j = (_h = storyBtn.parentNode) === null || _h === void 0 ? void 0 : _h.parentNode) === null || _j === void 0 ? void 0 : _j.parentNode) === null || _k === void 0 ? void 0 : _k.parentNode) === null || _l === void 0 ? void 0 : _l.parentNode, 'white');
        }
    }
    if (document.getElementsByClassName('custom-btn').length === 0) {
        // user profile
        const profileBtn = document.querySelector('section main header section svg circle');
        if (profileBtn) {
            (0,_button__WEBPACK_IMPORTED_MODULE_0__.addCustomBtn)((_o = (_m = profileBtn.parentNode) === null || _m === void 0 ? void 0 : _m.parentNode) === null || _o === void 0 ? void 0 : _o.parentNode, iconColor);
        }
        // reel
        if (window.location.pathname.startsWith('/reel/')) {
            const saveBtn = document.querySelector('section>main>div>div>div>div:nth-child(2)>div>div:nth-of-type(3)>div>div:nth-of-type(3)>div>div[role="button"]>button>div:nth-of-type(2)>svg');
            if (saveBtn) {
                (0,_button__WEBPACK_IMPORTED_MODULE_0__.addCustomBtn)((_p = saveBtn.parentNode) === null || _p === void 0 ? void 0 : _p.parentNode, iconColor);
            }
        }
    }
}, 1000);

})();

/******/ })()
;