(function ($) {
  // register namespace
  $.extend(true, window, {
    "Slick": {
      "Plugins": {
        "HeaderRowSummary": HeaderRowSummary
      }
    }
  });
 
    function HeaderRowSummary(dataView, options) {
        var _grid;
        var _self = this;
        var _handler = new Slick.EventHandler();
        var _timeout;
        var _defaults = {
            minLabel: 'Min',
            maxLabel: 'Max',
            avgLabel: 'Avg',
            countLabel: 'Cnt',
            sumLabel: 'Sum'            
        };

        function defaultFormatter(row, cell, value) {
            return value;
        }

        function init(grid) {
            options = $.extend(true, {}, _defaults, options);
            _grid = grid;
            _handler
                .subscribe(_grid.onHeaderRowCellRendered, handleHeaderRowCellRendered)
                .subscribe(_grid.onBeforeHeaderCellDestroy, handleBeforeHeaderCellDestroy)
                .subscribe(dataView.onRowCountChanged, handleRowCountChanged)
                .subscribe(dataView.onRowsChanged, handleRowCountChanged);            
        }

        function destroy() {
            _handler.unsubscribeAll();
        }

        function computeAggregates(data, columns) {
            var x;
            var y;
            var length = data.length;
            var value;
            var $row;
            var $line;
            var $list;
            var column;

            for (y = 0; y < length; y++) {
                for (x = 0; x < columns.length; x++) {
                    if (columns[x].summaries && columns[x].summaries.length) {
                        value = data[y][columns[x].field];
                        column = columns[x];

                        if (y === 0 || column.aggregates == null) {
                            column.aggregates = {
                                sum: Number.NaN,
                                min: Number.NaN,
                                max: Number.NaN,
                                avg: Number.NaN,
                                count: 0
                            };
                        }

                        if (typeof value !== 'undefined' && value !== null && value !== '') {
                            column.aggregates.count++;
                        }

                        if (typeof value === 'number') {
                            if (isNaN(column.aggregates.sum)) {
                                column.aggregates.sum = 0;
                                column.aggregates.min = value;
                                column.aggregates.max = value;
                            } else {
                                column.aggregates.sum += value;
                                column.aggregates.min = Math.min(column.aggregates.min, value);
                                column.aggregates.max = Math.max(column.aggregates.max, value);
                            }
                        }
                    }
                }
            }

            if (length > 0) {
                for (x = 0; x < columns.length; x++) {
                    if (columns[x].summaries && columns[x].summaries.length){
                        if (columns[x].aggregates.count > 0) {
                            columns[x].aggregates.avg = columns[x].aggregates.sum / columns[x].aggregates.count;
                        }
                    }
                }
            }
        }

        function renderSummaries(columns) {
            $row = $(_grid.getHeaderRow());

            $row.find('.slick-headerrow-column').each(function (idx, el) {
                var text = [];
                var column = columns[idx];
                var formatter = column.formatter || defaultFormatter;

                $(el).empty();
                $list = $('<ul>').appendTo(el);

                if (!column.summaries || !column.summaries.length || !column.aggregates) {
                    return;
                }

                if (column.summaries.indexOf('count') >= 0) {
                    $line = $('<li>').appendTo($list);
                    $('<label>').text(options.countLabel).appendTo($line);
                    $('<span>').text(column.aggregates.count.toString()).appendTo($line);
                }

                if (column.summaries.indexOf('sum') >= 0 && !isNaN(column.aggregates.sum)) {
                    $line = $('<li>').appendTo($list);
                    $('<label>').text(options.sumLabel).appendTo($line);
                    $('<span>').text(formatter(-1, idx, column.aggregates.sum)).appendTo($line);
                }

                if (column.summaries.indexOf('min') >= 0 && !isNaN(column.aggregates.min)) {
                    $line = $('<li>').appendTo($list);
                    $('<label>').text(options.minLabel).appendTo($line);
                    $('<span>').text(formatter(-1, idx, column.aggregates.min)).appendTo($line);
                }

                if (column.summaries.indexOf('max') >= 0 && !isNaN(column.aggregates.max)) {
                    $line = $('<li>').appendTo($list);
                    $('<label>').text(options.maxLabel).appendTo($line);
                    $('<span>').text(formatter(-1, idx, column.aggregates.max)).appendTo($line);
                }

                if (column.summaries.indexOf('avg') >= 0 && !isNaN(column.aggregates.avg)) {
                    $line = $('<li>').appendTo($list);
                    $('<label>').text(options.avgLabel).appendTo($line);
                    $('<span>').text(formatter(-1, idx, column.aggregates.avg)).appendTo($line);
                }
            });
        }
	
        function handleHeaderRowCellRendered(e, args) {
	        $(args.node).empty();
            
	        renderSummaries(grid.getColumns());
        }

        function handleRowCountChanged() {
            if (_timeout) {
                window.clearTimeout(_timeout);
            }

            _timeout = window.setTimeout(function () {
                var cols = _grid.getColumns();
                computeAggregates(dataView.getItems(), cols);
                renderSummaries(cols);
            }, 10);
        }

        function handleBeforeHeaderCellDestroy(e, args) {

        }

        $.extend(this, {
          "init": init,
          "destroy": destroy
        });
    }
})(jQuery);
