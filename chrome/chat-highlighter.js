// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const validLanguages = /^\s*?(markup|html|xml|svg|mathml|ssml|atom|rss|css|clike|javascript|js|abap|abnf|actionscript|ada|al|antlr4|g4|apacheconf|apl|applescript|aql|arduino|arff|asciidoc|adoc|asm6502|aspnet|autohotkey|autoit|bash|shell|basic|batch|bbcode|shortcode|bison|bnf|rbnf|brainfuck|brightscript|bro|c|concurnas|conc|csharp|cs|dotnet|cpp|cil|coffeescript|coffee|cmake|clojure|crystal|csp|css-extras|d|dart|dax|diff|django|jinja2|dns-zone-file|dns-zone|docker|dockerfile|ebnf|eiffel|ejs|eta|elixir|elm|etlua|erb|erlang|excel-formula|xlsx|xls|fsharp|factor|firestore-security-rules|flow|fortran|ftl|gcode|gdscript|gedcom|gherkin|git|glsl|gml|gamemakerlanguage|go|graphql|groovy|haml|handlebars|haskell|hs|haxe|hcl|hlsl|http|hpkp|hsts|ichigojam|icon|iecst|inform7|ini|io|j|java|javadoc|javadoclike|javastacktrace|jolie|jq|jsdoc|js-extras|js-templates|json|webmanifest|jsonp|json5|julia|keyman|kotlin|latex|tex|context|latte|less|lilypond|ly|liquid|lisp|emacs|elisp|emacs-lisp|livescript|llvm|lolcode|lua|makefile|markdown|md|markup-templating|matlab|mel|mizar|monkey|moonscript|moon|n1ql|n4js|n4jsd|nand2tetris-hdl|nasm|neon|nginx|nim|nix|nsis|objectivec|objc|ocaml|opencl|oz|parigp|parser|pascal|objectpascal|pascaligo|pcaxis|px|peoplecode|pcode|perl|php|phpdoc|php-extras|plsql|powerquery|pq|mscript|powershell|processing|prolog|properties|protobuf|pug|puppet|pure|purebasic|pbfasm|python|py|q|qml|qore|r|racket|rkt|jsx|tsx|renpy|rpy|reason|regex|rest|rip|roboconf|robotframework|robot|ruby|rb|rust|sas|sass|scss|scala|scheme|shell-session|smalltalk|smarty|solidity|sol|solution-file|sln|soy|sparql|rq|splunk-spl|sqf|sql|stylus|swift|tap|tcl|textile|toml|tt2|turtle|trig|twig|typescript|ts|t4-cs|t4|t4-vb|t4-templating|unrealscript|uscript|uc|vala|vbnet|velocity|verilog|vhdl|vim|visual-basic|vb|warpscript|wasm|wiki|xeora|xeoracube|xml-doc|xojo|xquery|yaml|yml|zig)\s*?$/gm;

// classnames can change with any deployment since they are only hashes of classes.
// however we only need to find the classname once and can cache it for further lookups.
let codeSpanSelector = null;

function getCodeSpanClass() {
    for (const span of [...document.querySelectorAll("span")]) {
        const content = span.textContent.replace(/\s*/gm, '');

        if (content === "```") {
            codeSpanSelector = span.className;
            return span.className;
        }
    }
}

async function highlight() {
    const selector = codeSpanSelector || getCodeSpanClass();
    for (const span of [...document.querySelectorAll(`.${selector}`)]) {
        try {
            // the original formatted div by google chat
            const codeDiv = span.nextElementSibling;
            if (!codeDiv) continue;

            // check first line for language definition
            let [language] = codeDiv.textContent.split("\n");
            language = language.replace(/\s*/g, "");

            // no valid language definition, nothing to highlight
            if (!language || !validLanguages.test(language)) continue;

            // prismjs works with a pre > code structure by default
            const languageClass = `lang-${language}`;
            const preNode = document.createElement("pre");
            preNode.classList.add("line-numbers"); // injects line-numbers plugin
            preNode.classList.add(languageClass);

            const codeNode = document.createElement("code");
            codeNode.classList.add(languageClass);

            // remove language definition from output
            codeNode.textContent = codeDiv.textContent.replace(
                new RegExp(`^\s*?${language}\s*?\n`),
                ""
            );

            // apply nodes to dom
            preNode.appendChild(codeNode);
            codeDiv.replaceWith(preNode);

            // finally highlight the contents
            Prism.highlightElement(codeNode);
        } catch (e) {
            console.error(e);
        }
    }
}

// todo: couldn't measure any performance problems with highlighting all blocks every second.
// highlighting 10 codeblocks took around 2ms on a macbook pro 2017
// however: maybe evaluate adding a MutationObserver to the codeblocks instead
setInterval(async () => document.hasFocus() && (await highlight()), 1000);
