export default render;
/**
 * 简易的HTML模板引擎，在本项目中用于渲染展示翻译结果的页面。
 *
 * @param {String} template 待渲染的HTML模板。
 * @param {Object} contents 用于填充模板的数据。
 * @returns 渲染完成的HTML文本。
 */
function render(template, contents) {
    // process the template in advance
    template = template.toString().replace(/\n|\s{2,}|\r/g, "");
    // 匹配模板中的待填充部分
    const CONTENT_REGEX = /<%\s*(.*?)\s*%>/g;

    // 匹配模板中的逻辑表达式
    const EXPRESSION_REGEX = /(if|while|for)\s*\(.+\)\s*\{|else(\s+if\s*\(.+\))?\s*\{|}/;

    // 上次匹配结束后剩余子串在template中的起始位置
    var lastIndex = 0;
    var code = ["var result = new Array();"];
    var match;

    // 依次匹配所有待填充项
    while ((match = CONTENT_REGEX.exec(template))) {
        // 从当前剩余子串的起始位置到本次匹配到的待填充项的起始位置之间的部分，直接保留。
        if (match.index > lastIndex) {
            code.push("result.push('" + template.substring(lastIndex, match.index) + "');");
        }

        var expression = match[1];
        // 如果是逻辑表达式，将其作为一行代码插入到渲染函数中。
        if (EXPRESSION_REGEX.test(expression)) {
            code.push(expression);
            // 如果是一个变量，获取它的值用于填充它所在的位置，并且默认对内容进行HTML标签转义
        } else {
            code.push("result.push(this.escapeHTML(" + expression + "));");
        }

        lastIndex = match.index + match[0].length;
    }

    // 处理模板末尾的非待填充文本。
    if (lastIndex < template.length - 1) {
        code.push("result.push('" + template.substring(lastIndex, template.length) + "');");
    }

    code.push("return result.join('');");
    // add escapeHTML function to the execution context
    contents.escapeHTML = escapeHTML;
    return new Function(code.join("").replace(/\n|\r/g, "")).apply(contents);
}

/**
 * escape HTML tag to avoid XSS security problems
 * @param {string} str string text to be escaped
 */
function escapeHTML(str) {
    const REGEX_HTML_ESCAPE = /"|&|'|<|>/g;

    if (typeof str !== "string") return str;
    return str.replace(REGEX_HTML_ESCAPE, expression => {
        var char = expression.charCodeAt(0);
        var result = ["&#"];
        char = char == 0x20 ? 0xa0 : char;
        result.push(char);
        result.push(";");
        return result.join("");
    });
}
