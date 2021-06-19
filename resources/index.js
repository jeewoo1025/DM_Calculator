
const parser = math.parser();

const SYMBOL_WIDTH = 50;
const SYMBOL_HEIGHT = 50;

const POPUP_WIDTH = 24;
const POPUP_HEIGHT = 24;

const BUTTON_WIDTH = 100;
const BUTTON_HEIGHT = 40;

let MathApp = {};

MathApp.symbol_paths = {
        '+':    "add",
        '-':    "sub",
        '*':    "mul",
        '/':    "div",
        '(':    "parenthesis_open",
        ')':    "parenthesis_close",
        '[':    "squarebracket_open",
        ']':    "squarebracket_close",
        '{':    "curlybrace_open",
        '}':    "curlybrace_close",
        '.':    "period",
        ',':    "comma",
        ':':    "colon",
        ';':    "semicolon",
        '=':    "equal",
        '>':    "more",
        '<':    "less",
        '!':    "exclamation",
        '^':    "caret",
        '≠':    "notequal",
        '≤':    "lessequal",
        '≥':    "moreequal",
};

MathApp.blocks = [];
MathApp.selected_block = null;

// 스피너
MathApp.is_spinner_item_selected = false;  
MathApp.selected_spinner = null;

MathApp.is_mouse_dragging = false;       
MathApp.mouse_drag_prev = {x:0, y:0};

MathApp.popup_blocks = [];
MathApp.buttons = [];

MathApp.block_types = {
    UNDEFINED:  "undefind",
    SYMBOL:     "symbol",
    POPUP:      "popup",
    BUTTON:     "button",
    SPINNER:    "spinner",
};

MathApp.initialize = function() {
    for(let i=0; i <= 9; i++)
    {
        let key = i.toString();
        let value = key;
        this.symbol_paths[key] = value;
    }

    for(let c="a".charCodeAt(0); c <= "z".charCodeAt(0); c++)
    {
        let key = String.fromCharCode(c);
        let value = key;
        this.symbol_paths[key] = value;
    }

    this.canvas = new fabric.Canvas("c", {
        backgroundColor: "#eee",
        hoverCursor: "default",
        selection: false
    });

    //
    $(document).keypress(function(event) {
        let key = String.fromCharCode(event.which);
        MathApp.handleKeyPress(key);
    });
    $(document).keydown(function(event) {
        MathApp.handleKeyDown(event);
    });
    $(document).mousedown(function(event) {
        let p = {x: event.pageX, y: event.pageY};
        MathApp.handleMouseDown(p);
    });
    $(document).mouseup(function(event) {
        let p = {x: event.pageX, y: event.pageY};
        MathApp.handleMouseUp(p);
    });
    $(document).mousemove(function(event) {
        let p = {x: event.pageX, y: event.pageY};
        MathApp.handleMouseMove(p);
    });

    // Block 초기화
    MathApp.initBlocks();
}

MathApp.initBlocks = function() {
    let btn_size = {
        width: BUTTON_WIDTH,
        height: BUTTON_HEIGHT
    };

    let btn_pos = {
        x : 780,
        y : 10
    };

    btn_values = [['숫자x2','#c7e2cf'], ['전체삭제','#e68a7b'], ['그래프','#d9b191']];
    for(let i=0; i<btn_values.length; i++) {
        let tmp_pos = {
            x: btn_pos.x + ((BUTTON_WIDTH+15)*i),
            y: btn_pos.y
        };

        MathApp.buttons.push(new MathApp.Button(tmp_pos, btn_size, btn_values[i][0], btn_values[i][1]));
    }

    // 스피너
    spinner_pos = {
        x: 10,
        y: 10
    };

    spinner_values = [
        ["삼각함수", ["sin", "cos", "tan", "csc", "sec", "cot"]],
        ["비교연산", ["<", ">", "≤", "≥", "=", "≠"]],
        ["지수함수", ["2^", "10^", "e^", "log"]],
        ["행렬", ["cross", "det", "inv", "abs"]],
    ];
    for(let i=0; i<spinner_values.length; i++) {
        let tmp_pos = {
            x: spinner_pos.x +((BUTTON_WIDTH+15)*i),
            y: spinner_pos.y
        };

        new MathApp.Spinner(tmp_pos, btn_size, spinner_values[i][0], spinner_values[i][1]);
    }

    MathApp.canvas.requestRenderAll();
}

MathApp.handleKeyPress = function(key) {
    if (key in this.symbol_paths) 
    {
        let size = {
            width : SYMBOL_WIDTH,
            height : SYMBOL_HEIGHT
        };
        let position = {
            x : Math.random() * (this.canvas.width-size.width) + size.width/2,
            y : Math.random() * (this.canvas.height-size.height-60) + size.height/2 + 60
        }; // height : 버튼 아래 ~ 끝

        let new_symbol = new MathApp.Symbol(position, size, key);
    }
}

MathApp.handleKeyDown = function(event) {
    if(this.selected_block == null) {
        console.log("키 눌렀는데 블록이 선택 안됨.");
        return;
    } else {
        var prev_block = this.selected_block;
        MathApp.selected_block.onDeselected();
        MathApp.selected_block = null;
    }
    
    console.log("현재 키 : ", event.key);
    switch(event.key) {
        case 'Enter': {
            try {
                console.log("name : ", prev_block.name);
                // ≠, ≤, ≥ 예외처리
                let expr = prev_block.name;
                expr = expr.replace('≠', '!=').replace('≤', '<=').replace('≥', '>=');

                let result = parser.eval(expr).toString(); 
                result = result.replace(/\s/gi, ''); // 공백제거
                console.log('result : ', result);

                var tokens = result.substring(0,8);
                if(tokens == 'function') {
                    result = 'function';
                } 
                
                // 결과 symbol 생성
                let position  = {
                    x: prev_block.position.x,
                    y: prev_block.position.y + 100
                };

                // Symbol 생성
                MathApp.create_symbol_block(result, position);
            } catch(e) {
                // 에러메시지
                alert(e.name + ' - ' + e.message);
                console.log(e.name);
            }
            break;
        }
        case 'Delete': {
            prev_block.destroy();
            break;
        }
    }

    console.log(event.key);
}

// Symbol 생성하기
MathApp.create_symbol_block = function(value, position) {
    console.log("create symbol block : ", value, ' - ', position);
    var symbols = [];
    let size = {
        width : SYMBOL_WIDTH,
        height : SYMBOL_HEIGHT
    };

    for(let i=0; i<value.length; i++) {
        let tmp = {
            x: position.x + (SYMBOL_WIDTH*i),
            y: position.y
        };

        symbols.push(new MathApp.Symbol(tmp, size, value[i]));
    }

    setTimeout(function() {
        for(let i=0; i<value.length-1; i++) {
            let dest = MathApp.blocks[MathApp.blocks.length-2];
            let curr = MathApp.blocks[MathApp.blocks.length-1];

            curr.visual_items.forEach(item => {
                item.set({strokeWidth: 0.5});
                dest.visual_items.push(item);
            });

            dest.name += curr.name;
            dest.size.width += SYMBOL_WIDTH;

            curr.destroy();

            dest.visual_items.forEach(item => {
                MathApp.canvas.bringToFront(item);
            });
        }

        //바운더리 조정
        dest = MathApp.blocks[MathApp.blocks.length-1];
        dest.visual_items[2].set({width:dest.size.width});
        MathApp.canvas.bringToFront(dest.visual_items[2]);
    }, 200);
}

MathApp.handleMouseDown = function(window_p) {
    if(MathApp.isInCanvas(window_p))
    {
        let canvas_p = MathApp.transformToCanvasCoords(window_p);

        // 스피너 예외처리
        if(MathApp.selected_spinner && MathApp.selected_spinner.is_pushed) {
            // 마우스가 item 위에 있는지 확인
            let item_name = MathApp.selected_spinner.find_items_on(canvas_p);

            if(item_name) {
                let random_pos = {
                    x : (Math.random() * (900 - 20)) + 20,
                    y : (Math.random() * (700 - 100)) + 100
                }; // height : 버튼 아래 ~ 끝

                MathApp.create_symbol_block(item_name, random_pos);
                
                // 스피너 접기
                MathApp.selected_spinner.fold_items();
                MathApp.selected_spinner = null;

                MathApp.canvas.requestRenderAll();
                return;
            }
        }

        // 선택한 Block 찾기
        let block = MathApp.findBlockOn(canvas_p);

        let prev_block = MathApp.selected_block;

        if(MathApp.selected_block != null && MathApp.selected_block.type == MathApp.block_types.SYMBOL)
        {
            MathApp.selected_block.onDeselected();
            MathApp.selected_block = null;
        }

        if(block != null)
        {
            if(block.type == MathApp.block_types.POPUP) {
                if(block.name == "execute") { // 실행
                    console.log("실행 클릭");

                    try {
                        // ≠, ≤, ≥ 예외처리
                        let expr = prev_block.name;
                        expr = expr.replace('≠', '!=').replace('≤', '<=').replace('≥', '>=');

                        let result = parser.eval(expr).toString();
                        result = result.replace(/\s/gi, ''); // 공백제거
                        // console.log('result : ', result);

                        var tokens = result.substring(0,8);
                        if(tokens == 'function') {
                            result = 'function';
                        } 
                        
                        // 결과 symbol 생성
                        let position  = {
                            x: prev_block.position.x,
                            y: prev_block.position.y + 100
                        };

                        // Symbol 생성
                        MathApp.create_symbol_block(result, position);
                    } catch(e) {
                        // 에러메시지
                        alert(e.name + ' - ' + e.message);
                        console.log(e.message);
                    }
                } else if(block.name == "disassemble") { // 분해
                    console.log("분해 클릭");

                    if(prev_block.name.length > 1) {
                        for(let i=0; i<prev_block.name.length; i++) {
                            let position = {
                                x: prev_block.position.x + (80*i),
                                y: prev_block.position.y
                            };

                            MathApp.create_symbol_block(prev_block.name[i], position);
                        }
                        prev_block.destroy();
                    }
                } else if(block.name == "duplicate") { // 복제
                    console.log("복제 클릭");
                    let position = {
                        x: prev_block.position.x,
                        y: prev_block.position.y + 100
                    };
                    
                    MathApp.create_symbol_block(prev_block.name, position);
                } else if(block.name == "destroy") { // 소멸
                    console.log("소멸 클릭");
                    prev_block.destroy();
                }
            } else if(block.type == MathApp.block_types.BUTTON) {
                MathApp.selected_block = block;

                // block name에 따른 target 처리
                if(block.name == "전체삭제") {
                    // 모든 SYMBOL 블록들의 name 수집
                    MathApp.blocks.forEach(item => {
                        if(item.type == MathApp.block_types.SYMBOL) {
                            block.targets.push(item);
                        }
                    });
                } else { // 그래프, 숫자x2
                    if(prev_block)
                        block.targets.push(prev_block);
                }

                block.handleMouseDown();
            } else if(block.type == MathApp.block_types.SPINNER) {  // 스피너
                if(MathApp.selected_spinner && MathApp.selected_spinner != block
                    && MathApp.selected_spinner.is_pushed) {
                    // 오픈된 스피너가 있고, 오픈된 스피너 != 현재 블록
                    // 오픈된 스피너 접기
                    console.log("오픈된 스피너 접기");
                    MathApp.selected_spinner.fold_items();
                    MathApp.selected_spinner = null;
                }

                block.handleMouseDown();

                // 만약 is_pushed가 true라면 현재 스피너로 지정
                if(block.is_pushed) 
                    MathApp.selected_spinner = block;
            } else {
                MathApp.selected_block = block;
                MathApp.selected_block.onSelected();

                MathApp.is_mouse_dragging = true;
                MathApp.mouse_drag_prev = canvas_p;
            }
            
            MathApp.canvas.requestRenderAll();
        }
    }
    else
    {
        MathApp.is_mouse_dragging = false;
        MathApp.mouse_drag_prev = {x:0, y:0};
    }
}

MathApp.handleMouseMove = function(window_p) {
    if(MathApp.is_mouse_dragging)
    {
        // console.log("handleMouseMove");

        let canvas_p = MathApp.transformToCanvasCoords(window_p);
        if(MathApp.selected_block != null)
        {
            let tx = canvas_p.x - MathApp.mouse_drag_prev.x;
            let ty = canvas_p.y - MathApp.mouse_drag_prev.y;
            MathApp.selected_block.translate({x: tx, y: ty});

            MathApp.popup_blocks.forEach(item => {
                item.translate({x: tx, y: ty});
            });
        }
        MathApp.mouse_drag_prev = canvas_p;

        MathApp.canvas.requestRenderAll();
    }
}

MathApp.handleMouseUp = function(window_p) {
    // console.log("handle mouse UP");
    if(this.selected_block == null)
        return;

    let canvas_p = MathApp.transformToCanvasCoords(window_p);
    let block = MathApp.findBlockOn(canvas_p); 
    if(block && block.type == MathApp.block_types.BUTTON) {  // 버튼일 경우
        block.handleMouseUp();
        this.selected_block = null;
    } else if(MathApp.is_mouse_dragging) {
        // 중첩 검사
        let block = MathApp.findBlockOn(this.selected_block.position);

        // 조립
        if(block != this.selected_block && block != null) {
            let tmp = this.selected_block;
            let pos = {
                x: block.position.x + block.size.width,
                y: block.position.y
            };

            this.selected_block.moveTo(pos);

            // block 갱신
            tmp.visual_items.forEach(item => {
                item.set({strokeWidth: 0.5});
                block.visual_items.push(item);
            });

            block.name += tmp.name;
            block.size.width += tmp.size.width;
            
            this.selected_block.destroy();

            block.visual_items.forEach(item => {
                MathApp.canvas.bringToFront(item);
            });

            // 바운더리 조정
            block.visual_items[2].set({width:block.size.width});
            MathApp.canvas.bringToFront(block.visual_items[2]);
        }

        MathApp.is_mouse_dragging = false;
        MathApp.mouse_drag_prev = {x:0, y:0};
    }
    
    MathApp.canvas.requestRenderAll();
}

MathApp.transformToCanvasCoords = function(window_p) {
    let rect = MathApp.canvas.getElement().getBoundingClientRect();
    let canvas_p = {
        x : window_p.x - rect.left,
        y : window_p.y - rect.top
    };
    return canvas_p;
}

MathApp.isInCanvas = function(window_p) {
    let rect = MathApp.canvas.getElement().getBoundingClientRect();
    if(window_p.x >= rect.left && 
        window_p.x < rect.left + rect.width &&
        window_p.y >= rect.top && 
        window_p.y < rect.top + rect.height)
    {
        return true;
    }
    else
    {
        return false;
    }
}

MathApp.findBlockOn = function(canvas_p) {
    let x = canvas_p.x;
    let y = canvas_p.y;

    for(let i=0; i < this.blocks.length; i++)
    {
        let block = this.blocks[i];
        if(block.type == MathApp.block_types.BUTTON || block.type == MathApp.block_types.SPINNER) {
            if (x >= block.position.x &&
                x <= block.position.x + block.size.width &&
                y >= block.position.y &&
                y <= block.position.y + block.size.height) {
                return block;
            }   
        }

        if(block == this.selected_block)
            continue;

        let standard_width = SYMBOL_WIDTH/2;
        let is_multiy = 1;

        if(block.type == MathApp.block_types.POPUP) {
            standard_width = POPUP_WIDTH/2;
            is_multiy = 0;
        }

        if(x >= block.position.x - standard_width && x <= block.position.x + standard_width + block.size.width*is_multiy &&
            y >= block.position.y - block.size.height/2 && y <= block.position.y + block.size.height/2)
        {
            return block;
        }               
    }
    return null;
}

// Block 객체 (위젯)
MathApp.Block = function(position, size) {
    this.position = position;
    this.size = size;
    this.type = MathApp.block_types.UNDEFINED;

    this.visual_items = [];

    MathApp.blocks.push(this);
}

MathApp.Block.prototype.onDeselected = function() {
    this.visual_items[2].set({stroke: "rgba(0,0,255,1)"});

    // 팝업창 제거
    MathApp.popup_blocks.forEach(item => { item.destroy() });
    MathApp.popup_blocks = [];
}

MathApp.Block.prototype.onSelected = function() {
    this.visual_items[2].set({stroke: "rgba(255,0,0,1)"});

    this.visual_items.forEach(item => {
        MathApp.canvas.bringToFront(item);
    });
    MathApp.canvas.bringToFront(this.visual_items[2]);

    // 팝업창 생성 - 실행, 분해, 복제, 소멸
    let popup_icons = ["destroy", "execute", "disassemble", "duplicate"];
    for(let i=0; i < popup_icons.length; i++) {
        let size = {
            width: POPUP_WIDTH,
            height: POPUP_HEIGHT
        };

        let position = {
            x: this.position.x + (POPUP_WIDTH*i),
            y: this.position.y + this.size.height
        };

        MathApp.popup_blocks.push(new MathApp.Popup(position, size, popup_icons[i]));
    }
}

MathApp.Block.prototype.moveTo = function(p) {
    let tx = p.x - this.position.x;
    let ty = p.y - this.position.y;

    this.translate({x: tx, y: ty});
}

MathApp.Block.prototype.translate = function(v) {
    this.position.x += v.x;
    this.position.y += v.y;

    this.visual_items.forEach(item => {
        item.left += v.x;
        item.top += v.y;
    });
}

MathApp.Block.prototype.destroy = function() {
    if(this == MathApp.selected_block)
    {
        MathApp.selected_block = null;
        this.onDeselected();
    }

    this.visual_items.forEach(item => {
        MathApp.canvas.remove(item);
    });
    this.visual_items = [];
    
    let index = MathApp.blocks.indexOf(this);
    if(index > -1)
    {
        MathApp.blocks.splice(index, 1);
    }
}

// Block을 상속
MathApp.Symbol = function(position, size, name) {
    MathApp.Block.call(this, position, size);
    this.type = MathApp.block_types.SYMBOL;
    this.name = name;

    let block = this;

    if (name in MathApp.symbol_paths) 
    {
        let path = 'resources/images/' + MathApp.symbol_paths[name] + ".jpg";
        fabric.Image.fromURL(path, function(img) {
            // (0) Background
            let background = new fabric.Rect({
                left: position.x - size.width/2,
                top: position.y - size.height/2,
                width: size.width,
                height: size.height,
                fill: "rgba(255,255,255,1)",
                stroke: "rgba(0,0,0,0)",
                selectable: false
            });

            // (1) Image
            img.scaleToWidth(size.width);
            img.scaleToHeight(size.height);

            let img_w = img.getScaledWidth();
            let img_h = img.getScaledHeight();

            img.set({
                left: position.x - img_w/2,
                top: position.y - img_h/2,
                selectable: false
            });

            // (2) Boundary
            let boundary = new fabric.Rect({
                left: position.x - size.width/2,
                top: position.y - size.height/2,
                width: size.width,
                height: size.height,
                fill: "rgba(0,0,0,0)",
                stroke: "rgba(0,0,255,1)",
                strokeWidth: 5,
                selectable: false
            });

            //
            MathApp.canvas.add(background);
            MathApp.canvas.add(img);
            MathApp.canvas.add(boundary);

            //
            block.visual_items.push(background);
            block.visual_items.push(img);
            block.visual_items.push(boundary);
        });
    }
}

MathApp.Symbol.prototype = Object.create(MathApp.Block.prototype);

// Popup 위젯 - Block 상속
MathApp.Popup = function(position, size, name) {
    MathApp.Block.call(this, position, size);
    this.type = MathApp.block_types.POPUP;
    this.name = name;

    let block = this;

    let path = 'resources/images/' + name + ".png";
    fabric.Image.fromURL(path, function(img) {
        // (0) Background
        let background = new fabric.Rect({
            left: position.x - size.width/2,
            top: position.y - size.height/2,
            width: size.width,
            height: size.height,
            fill: "rgba(255,255,255,1)",
            stroke: "rgba(0,0,0,0)",
            selectable: false
        });

        // (1) Image
        img.scaleToWidth(size.width-6);
        img.scaleToHeight(size.height-6);

        let img_w = img.getScaledWidth();
        let img_h = img.getScaledHeight();

        img.set({
            left: position.x - img_w/2 + 1,
            top: position.y - img_h/2 + 1,
            selectable: false
        });

        // (2) Boundary
        let boundary = new fabric.Rect({
            left: position.x - size.width/2,
            top: position.y - size.height/2,
            width: size.width,
            height: size.height,
            fill: "rgba(0,0,0,0)",
            stroke: "blue",
            strokeWidth: 2,
            selectable: false
        });

        //
        MathApp.canvas.add(background);
        MathApp.canvas.add(img);
        MathApp.canvas.add(boundary);

        //
        block.visual_items.push(background);
        block.visual_items.push(img);
        block.visual_items.push(boundary);
    });
}

MathApp.Popup.prototype = Object.create(MathApp.Block.prototype);

// Button 위젯
MathApp.Button = function(position, size, name, color) {
    MathApp.Block.call(this, position, size);
    this.type = MathApp.block_types.BUTTON;
    this.name = name;
    this.targets = [];

    this.is_pushed = false;

    // visual items
    let background = new fabric.Rect({
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        fill: color,
        stroke: 'white',
        strokeWidth: 2,
        selectable: false
    });

    let text = new fabric.Text(this.name, {
        left: position.x,
        top: position.y,
        fontFamily: 'Arial',
        fontSize:   18,
        fontWeight: 'normal',
        textAlign:  'center',
        stroke:     'black',
        fill:       'black',
        selectable: false
    });

    text.left = position.x + size.width/2 - text.width/2;
    text.top = position.y + size.height/2 - text.height/2;

    MathApp.canvas.add(background);
    MathApp.canvas.add(text);

    this.visual_items.push(background);
    this.visual_items.push(text);
}

MathApp.Button.prototype = Object.create(MathApp.Block.prototype);
MathApp.Button.prototype.constructor = MathApp.Button;

MathApp.Button.prototype.handleMouseDown = function() {
    if(!this.is_pushed) {
        this.translate({x:0, y:5});
        this.is_pushed = true;

        this.onPushed.call(this);
    }
};

MathApp.Button.prototype.handleMouseUp = function() {
    if(this.is_pushed) {
        this.translate({x:0, y:-5});
        this.is_pushed = false;
    }
};

MathApp.Button.prototype.onPushed = function() {
    if(this.targets.length <= 0) {
        // 선택 or 캔버스에 아무것도 없음
        return;
    }

    if(this.name == '전체삭제') {
        this.targets.forEach(item => item.destroy());
    } else if(this.name == '그래프') {
        try {
            let target = this.targets[0].name.slice(0, -3);
            let val = parser.get(target);

            // x축,y축 생성
            const xValues = math.range(-20, 20, 0.1).toArray()
            const yValues = xValues.map(function (x) {
                return val(x);
            });

            // plotly 그래프 생성
            const trace1 = {
                x: xValues,
                y: yValues,
                type: 'scatter'
            }
            const data = [trace1];

            $('#expr').text(this.targets[0].name+"의 그래프");
            Plotly.newPlot($('#plot')[0], data);
        } catch(e) {
            console.log(e);
            alert(e.name, ' - ', e.message);
        }
    } else if(this.name == '숫자x2') { 
        console.log('숫자x2 판별 : ', this.targets[0].name%1 === 0);

        if(this.targets[0].name%1 === 0) { // 정수인 경우 
            let position = {
                x: this.targets[0].position.x,
                y: this.targets[0].position.y
            };

            MathApp.create_symbol_block(this.targets[0].name.repeat(2), position);
            this.targets[0].destroy();
        }
    }

    this.targets = [];
}

// Spinner 위젯
MathApp.Spinner = function(position, size, name, items_name) {
    MathApp.Block.call(this, position, size);
    this.type = MathApp.block_types.SPINNER;
    this.name = name;

    this.is_pushed = false;

    // visual_items
    let background = new fabric.Rect({
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        fill: '#263842',
        stroke: '#263842',
        strokeWidth: 2,
        selectable: false
    });

    let text = new fabric.Text(this.name, {
        left: position.x + 10,
        top: position.y,
        fontFamily: 'tahoma',
        fontSize:   14,
        fontWeight: 'lighter',
        textAlign:  'center',
        stroke:     'white',
        fill:       'white',
        selectable: false
    });

    let triangle = new fabric.Triangle({
        left: position.x + text.width + 25,
        top: position.y,
        width: 10,
        height: 10,
        fill: 'white',
        stroke: 'white',
        selectable: false
    });

    text.top = position.y + size.height/2 - text.height/2;
    if(this.name == "행렬") {
        text.left += 15;
        triangle.left += 15;
    }

    triangle.top = position.y + size.height/2 - triangle.height/2;

    MathApp.canvas.add(background);
    MathApp.canvas.add(text);
    MathApp.canvas.add(triangle);

    this.visual_items.push(background);
    this.visual_items.push(text);
    this.visual_items.push(triangle);

    // item - visual items
    this.items_name = items_name;  
    this.items_visual_items = [];
    for(let i=0; i<items_name.length; i++) {
        let tmp_background = new fabric.Rect({
            left: this.position.x,
            top: this.position.y + this.size.height*(i+1) + 3,
            width: this.size.width,
            height: this.size.height,
            fill: '#263842',
            stroke: 'white',
            selectable: false,
            opacity: 0
        });

        let tmp_txt = new fabric.Text(items_name[i], {
            left: position.x,
            top: position.y,
            fontFamily: 'Courier New',
            fontSize:   18,
            fontWeight: 'lighter',
            textAlign:  'center',
            stroke:     'white',
            fill:       'white',
            selectable: false,
            opacity: 0
        });

        tmp_txt.left = tmp_background.left + tmp_background.width/2 - tmp_txt.width/2;
        tmp_txt.top = tmp_background.top + tmp_background.height/2 - tmp_txt.height/2;

        MathApp.canvas.add(tmp_background);
        MathApp.canvas.add(tmp_txt);

        this.items_visual_items.push(tmp_background);
        this.items_visual_items.push(tmp_txt);
    }
}

MathApp.Spinner.prototype = Object.create(MathApp.Block.prototype);
MathApp.Spinner.prototype.constructor = MathApp.Spinner;

MathApp.Spinner.prototype.find_items_on = function(canvas_p) {
    let x = canvas_p.x;
    let y = canvas_p.y;

    // background만 검사, 마우스가 아이템 위에 있으면 해당 아이템의 이름(name) 반환
    for(let i=0; i < this.items_visual_items.length; i+=2)
    {
        let item = this.items_visual_items[i];
        // console.log("현재 아이템 : ", item);

        if (x >= item.left &&
            x <= item.left + item.width &&
            y >= item.top &&
            y <= item.top + item.height) {
                return this.items_name[i/2];
        }
    }

    return null;
}

MathApp.Spinner.prototype.fold_items = function() {  
    console.log(this.name, "  아이템 접기");

    // ▲
    this.visual_items[2].set("left", this.visual_items[2].left-10);
    this.visual_items[2].set("top", this.visual_items[2].top-10);
    this.visual_items[2].set("angle", 0);

    // 아이템 접기
    this.items_visual_items.forEach(item => {
        item.set("opacity", 0);
    });

    this.is_pushed = false;
}

MathApp.Spinner.prototype.unfold_items = function() {
    console.log(this.name, "  아이템 펼치기");

    // ▼
    this.visual_items[2].set("left", this.visual_items[2].left+10);
    this.visual_items[2].set("top", this.visual_items[2].top+10);
    this.visual_items[2].set("angle", -180);

    // 아이템 펼치기
    this.items_visual_items.forEach(item => {
        item.set("opacity", 1);
        MathApp.canvas.bringToFront(item);
    });

    this.is_pushed = true;
}

MathApp.Spinner.prototype.handleMouseDown = function() {
    if(!this.is_pushed) { // is_pushed == false
        this.unfold_items();
    } else { // is_pushed == true
        this.fold_items();
    }
};


//
$(document).ready(function() {
    MathApp.initialize();
});