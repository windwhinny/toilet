## toilet

---

express 中间件 ，用以动态编译 js/less/sass 文件，并返回给浏览器。

Installation

```
npm install @mtfe/toilet
```

## Useage

```
var toilet = require('toilet');
var app = require('exiress').createServer();

app.use(toilet({
    baseDir: 'src/views'
}));

app.listen(80);
```

当作如下请求的时候：

```
/styles/index.css
```

toilet 将会读取如下文件，并返回编译后的结果。toilet 将会自动处理 import 、require 依赖, 并将所有的依赖和源文件合并在一起返回。

```
src/views/styles/index.css
```

## Options

### bashDir

文件储存的目录, 可以为 string 或者 [string] 。

### replacement

当我们使用 less 或者 sass 的时候，会遇到文件名不是 css 的情况，这时需要做如下设置：

```
app.use(toilet({
    baseDir: 'src/views',
    replacement: {
        css: 'scss'
    }
}
}));
```

这样 toilet 就会自动把 `.css` 文件的请求转换为 `.scss` 。

### engines

toilet 默认只支持 js 和 sass 文件类型，对应 browserify 和 node-sass。
如果用户使用 less 或者其它文件，需要自己写 engine。

engine 的签名如下：

```
var engine = function(req, file, callback) {
    callback(err, {
        // 对应 http 头部的 Content-Type 值， 如 text/css
        contentType: '<Content-Type>',

        // 处理后得到的数据，可以是字符串或者 readableStream
        data: stringOrStream
    })
};
```

## License

---

Copyright (c) 2015 Eric Time [windwhinny@gmail.com](mailto:windwhinny@gmail.com), MIT License
