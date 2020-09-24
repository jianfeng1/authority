<!--
 * @Author: liuxiaoman
 * @Date: 2020-08-10 16:20:19
 * @LastEditTime: 2020-09-04 15:20:16
 * @Description: 
-->
<template>
    <div class="avatar item" :data-uaid="key" :style="style"></div>
</template>

<script>
import { QueryUserIconFunction } from "../../../../../lib/common/SnJsBridge";
import { isPC } from "../../../../../utils/commonUtil";
export default {
    components: {},

    data() {
        return {
            style: {
                backgroundImage:
                    "url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAIAAAAlC+aJAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyhpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNi1jMDY3IDc5LjE1Nzc0NywgMjAxNS8wMy8zMC0yMzo0MDo0MiAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTUgKE1hY2ludG9zaCkiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6QzczQTY3RjRDNDE1MTFFNjk1NTU4ODczNjUzRDkzOTciIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6QzczQTY3RjVDNDE1MTFFNjk1NTU4ODczNjUzRDkzOTciPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDpDNzNBNjdGMkM0MTUxMUU2OTU1NTg4NzM2NTNEOTM5NyIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDpDNzNBNjdGM0M0MTUxMUU2OTU1NTg4NzM2NTNEOTM5NyIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PjczLL0AAAJWSURBVHja7Jl3i/JAEIcvZyyxNxC//0cTCxiNPWos9xDhLeLdZeOuWWHmj4Cwmnl2p/xmdYbD4cc72+fHm5sACIAACIAACIAAZGmuiR+9Xq9hGB6Px/P5zMdiseh5Xi6XewMAXF8sFkEQ3Fz/Y47j1Ov1TqejHUMnAE6PRqP9fv8QbLlcbjabfr/PadiYA7j4nff/EqLef16TGYDv+0k8g3MymfC0CyCKIkI/+WLCyS6A9XqttH61WtkFsNvtlNYfDoe7MpV9CKl+5XQ6WQSQIikvl4tFACnak+u6FgGUSiVV4Hw+bxFApVIxuv4VAIVCIfn6ZrNpFwBardfr8UyyuN1uo0+tkxKkQRKGWq2GJrVUjeIctQWp87DGw4brrVZLr5x2tF/u0hNQCihnBhpI8Jv0IEkajYau0ml2IsPjRmwyE2dxAkg0poLbNIyhFziQXGx0LoqPUrV9HQC+EveIamTmrz2YfCDdy+WyFQCk6Xw+x/uEeu6GinEUVCQm/SyrEFPYbDZ7RlcSVHSPZ/payiRmv8fj8XQ6fVIVE3KDwSAIgpcC4D3nRqXX1Td832cvXgdArw3DUG8xIRrJpVcAUGp07f2dkU4p9uUzxXGb60opAkkNYLvd6hrGv8tp1QsOZQDT0kA1PtUA0AimAX7t5U8B6LqN0vgK5SQ2DaD6CjUA7VryobgwCNDtdk1MVX+lpevyCrNiDvFDoaDjRFF0ie1uHPt5rr/G9t8WxsbZep5XrVYTXm2kl9O8rB6bJROZ/E8sAAIgAAIgAAIgAAIgANnZlwADAKjMTgHYqpZIAAAAAElFTkSuQmCC)",
            },
            key: "",
        };
    },
    props: {
        uaid: {
            type: String,
            default: 0,
        },
    },
    watch: {
        uaid: {
            immediate: true,
            handler: function () {
                let _this = this;
                let isIOS = /iphone|ipad|ipod/.test(
                    navigator.userAgent.toLowerCase()
                );
                QueryUserIconFunction({ uaid: _this.uaid }).then((data) => {
                    if (data && data.iconData) {
                        if (isIOS) {
                            let base64 = data.iconData.replaceAll("\n", "");
                            base64 = base64.replaceAll("\r", "");
                            _this.style.backgroundImage = `url(data:image/jpg;base64,${base64})`;
                        } else {
                            //安卓系统replaceAll方法报错，用forEach循环拼接base64
                            let iconDataArr = data.iconData.split("\n");
                            let iconString = "";
                            iconDataArr.forEach((item) => {
                                iconString += item;
                            });
                            _this.style.backgroundImage = `url(data:image/jpg;base64,${iconString})`;
                        }
                        _this.key = _this.uaid;
                    } else {
                        _this.style.backgroundImage = `url(../communication_icon/${_this.uaid})`;
                    }
                });
            },
        },
    },
};
</script>
<style lang='less'>
.avatar {
    background-size: contain;
}
</style>