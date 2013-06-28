/**
 *
 *
 */
(function($) {

    var spg = $.simpleGrid = {}, defaults = {};
    $.extend(spg, {
        setDefaults : function(settings) {
            defaults = settings;
        }
    });

    var fn = {
        createRow : function(rowData, rowDef, isHeader, index) {
            //fix undefined
            rowData = rowData || {};
            var _s = this[0].getSettings(), rowKey = _s.key, checkbox = _s.checkbox, rowData = (function() {
                var _rowData = {}
                for (var idx in rowDef) {
                    _rowData[rowDef[idx].id] = isHeader ? rowDef[idx].header : rowData[rowDef[idx].id] || rowData[idx] || "";
                }
                _rowData.__emptyRow = rowData.__emptyRow;
                return _rowData;
            })();

            var wrapper = $(_s.rowWrapperTmp).data("rowData", rowData).addClass( isHeader ? 'sp-row-header' : 'sp-row').attr("data-rid", rowKey && rowData[rowKey] || index);
            var row = wrapper.find(".sp-row");
            var col = $(_s.columnTmp);

            var ccol = col.clone(), actCol = ccol.is(".sp-col") ? ccol : ccol.find(".sp-col");
            actCol.append($("<div class='sp-checkbox' " + ((isHeader || rowData.__emptyRow) && "style='visibility: hidden;'") + "><input type='checkbox' /></div>"));
            row.append(actCol.css("display", checkbox ? '' : 'none'));

            for (var idx in rowDef) {
                var val = isHeader ? rowDef[idx].header : rowData[rowDef[idx].id] || rowData[idx] || "";
                var isEmptyRow = !!rowData.__emptyRow;
                var ccol = col.clone(), actCol = ccol.is(".sp-col") ? ccol : ccol.find(".sp-col");
                row.append(ccol);
                actCol.attr("data-cid", rowDef[idx].id).css({
                    width : rowDef[idx].width || "auto",
                    textAlign : !isHeader && rowDef[idx].align || "center",
                    display : rowDef[idx].hidden ? 'none' : 'auto'
                }).html(!isEmptyRow && !isHeader && rowDef[idx].formatter && rowDef[idx].formatter.call(actCol, val, rowData, rowDef[idx]) || val).data("relVal", val).attr("title",val);
            }

            return wrapper;
        },

        fillRowData : function(rows) {
            while (rows.length < this[0].getSettings().defaultRow) {
                rows.push({
                    __emptyRow : true
                });
            }
            return rows;
        },

        addGridData : function(data, append) {
            fn.dataGenerate.call(this, data.rows);
            fn.paggerGenerate.call(this, data);
            return this;
        },

        paggerGenerate : function(datas) {
            var _s = this[0].getSettings();
            _s.onPaggerRender && _s.onPaggerRender.call(this, datas);
            //TODO default
            return this;
        },

        setParams : function(settings) {
            $.extend(this[0].getSettings(), settings);
            return this;
        },

        dataGenerate : function(rows, append) {
            var _s = this[0].getSettings(), rows = fn.fillRowData.call(this, rows);
            var _body = this.find(".sp-grid-body");
            if (!append) {
                _body.empty();
            }
            for (var idx in rows) {
                _body.append(fn.createRow.call(this, rows[idx], _s.columns, false, _s.key, idx));
            }
            return this;
        },

        clear : function() {
            fn.dataGenerate.call(this, []);
            this.data("data",[]);
            return this;
        },

        reload : function() {
            var _s = this[0].getSettings();
            var _this = this;
            if (_s.url) {
                $.ajax({
                    url : _s.url,
                    data : $.extend(_s.postData, _s.onQuery.call(this, _s.postData, _s) || {})
                }).done(function(res) {
                    var res = _s.onQueried && _s.onQueried.apply(this, arguments) || res;
                    fn.addGridData.call(_this, res.rows);
                    fn.paggerGenerate.call(_this, res);
                });
            }
            return _this;
        },
        /**
         * 取得目前所選取資料行資料
         */
        getSelRowDatas : function(stringify) {
            var res = []
            this.find(".sp-grid-body .sp-row-wrapper.sp-row-hightline").each(function() {
                res.push($(this).data("rowData"));
            });
            return stringify ? JSON.stringify(res) : res;
        },
        /**
         * 將GridData轉換為Array<JSON>值
         * @param {boolean} stringify
         */
        serializeGridData : function(stringify) {
            var res = []
            this.find(".sp-grid-body .sp-row-wrapper").each(function() {
                res.push($(this).data("rowData"));
            });
            return stringify ? JSON.stringify(res) : res;
        }
    }

    /**
     *<pre>
     * Rule :
     *    row : class="sp-row" data-role="spRow"
     *    column : class="sp-col" data-role="spCol"
     *</pre>
     */

    $.fn.simpleGrid = function(settings) {
        if (!settings)
            throw 'argument error';
        var _s = $.extend({
            url : '',
            postData : null,
            localFirst : false,
            height : 'auto',
            width : 'auto',
            defaultRow : 0,
            select : true,
            Key : null,
            checkbox : false,
            pagger : false,
            gridWrapperTmp : "<div data-role='simpleGrid' class='sp-grid'><div class='sp-grid-header' /><div class='sp-grid-body' /><div class='sp-grid-pagging' /></div>",
            rowWrapperTmp : '<ul class="sp-row-wrapper"><li class="list-left row-line" /><li class="list-center row-line"><table><tbody><tr class="sp-row" data-role="spRow"></tr></tbody></table></li><li class="list-right row-line" /></ul>',
            columnTmp : '<td data-role="spCol" class="sp-col" />',
            paggingTmp : '<ul class="sp-row-wrapper"><li class="list-left"></li><li class="list-center"><span class="sp-pagging"><button type="button" class="def-btn sp-pre-btn" /><button type="button" class="def-btn sp-next-btn" />[<span class="sp-curr-page"/>]</span></li><li class="list-right"></li></ul>',
            //events
            onPaggerRender : null,
            onClick : null,
            onPagging : null, //function(){}
            onQuery : function() {
            },
            onQueried : function() {
            }
            //
        }, defaults, settings);

        this[0]._s = _s;

        this[0].getSettings = (function(s) {
            return function() {
                return s;
            };
        })(_s);
        var _this = this;

        this.append($(_s.gridWrapperTmp).find(".sp-grid-header").append(fn.createRow.call(_this, {}, _s.columns, true, '')).end()).css({
            height : _s.height,
            width : _s.width
        }).on('click.spgrid.checkbox', '.sp-checkbox [type=checkbox]', function(e) {
            var t = $(this), r = t.closest(".sp-row-wrapper");
            setTimeout(function() {
                var checked = t.is(":checked");
                if (r.is(".sp-row")) {
                    if (checked) {
                        r.addClass("sp-row-hightline");
                        !_s.checkbox && r.siblings().removeClass("sp-row-hightline").find("input[type=checkbox]").attr("checked", false);
                        _s.onClick && _s.onClick.call(_this, r.data("rowData"));
                    } else {
                        r.removeClass("sp-row-hightline");
                    }
                } else {
                    r = r.closest(".sp-grid-header").siblings(".sp-grid-body").find(".sp-row-wrapper");
                    r[checked?'addClass':'removeClass']('sp-row-hightline').find("input[type=checkbox]").attr("checked", checked);
                }
            }, 1);
            e.stopPropagation();
            //  return false;
        }).on("click.spgrid", ".sp-row-wrapper", function() {
            if ((_s.select || _s.checkbox) && !($(this).data("rowData") && $(this).data("rowData").__emptyRow) && $(this).is(".sp-row")) {
                $(this).find(".sp-checkbox [type=checkbox]").trigger("click.spgrid.checkbox");
            }
            return false;

        }).on("click.spgrid.pagging", ".sp-next-btn,.sp-pre-btn", function(e) {
            var res
            _s.onPagging && ( res = _s.onPagging.call(_this, $(this).is(".sp-next-btn") ? "N" : "P", _s));
            res !== false && fn.reload.call(_this);
        });

        if (_s.pagger) {
            this.find(".sp-grid-pagging").append(_s.paggingTmp).end();
        }

        fn.clear.call(this);
        !_s.localFirst && fn.reload.call(this) || fn.addGridData.call(this, []);
        //export
        $.extend($.fn, {
            addGridData : fn.addGridData,
            clear : fn.clear,
            getSelRowDatas : fn.getSelRowDatas,
            serializeGridData : fn.serializeGridData,
            reload : fn.reload,
            setParams : fn.setParams
        });

        return this;
    }
})(jQuery);
