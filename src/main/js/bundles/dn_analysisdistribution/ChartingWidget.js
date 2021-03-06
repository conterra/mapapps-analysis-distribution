/*
 * Copyright (C) 2017 con terra GmbH (info@conterra.de)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
define([
    "dojo/_base/declare",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dojo/text!./templates/ChartingWidget.html",
    "dijit/layout/BorderContainer",
    "dijit/layout/ContentPane",
    "dojox/mobile/Switch",
    "dojox/charting/Chart",
    "dojox/charting/themes/MiamiNice",
    "dojox/charting/plot2d/Pie",
    "dojox/charting/plot2d/Columns",
    "dojox/charting/plot2d/ClusteredColumns",
    "dojox/charting/plot2d/StackedColumns",
    "dojox/charting/plot2d/Markers",
    "dojox/charting/axis2d/Default",
    "dojox/charting/widget/Legend",
    "dojox/charting/action2d/Tooltip",
    "dojox/charting/action2d/MoveSlice",
    "dojox/charting/action2d/Magnify",
    "dojox/charting/action2d/Highlight",
    "dojo/fx/easing",
    "ct/util/css",
    "./ChartingWidgetController"
], function (declare,
        _Widget,
        _TemplatedMixin,
        _WidgetsInTemplateMixin,
        templateStringContent,
        BorderContainer,
        ContentPane,
        Switch,
        Chart,
        theme,
        Pie,
        Columns,
        ClusteredColumns,
        StackedColumns,
        Markers,
        Default,
        Legend,
        Tooltip,
        MoveSlice,
        Magnify,
        Highlight,
        d_easing,
        ct_css,
        ChartingWidgetController) {
    return declare([_Widget, _TemplatedMixin,
        _WidgetsInTemplateMixin], {
        templateString: templateStringContent,
        legend: undefined,
        postCreate: function () {
            var tool = this.tool;
            this._chartingWidgetController = new ChartingWidgetController({
                source: this,
                tool: tool
            });
            this.connect(this.mapState, "onExtentChange", function () {
                this._chartingWidgetController.onNewData();
            });
            this.connect(tool, "onClick", function () {
                this._chartingWidgetController.createChart(this._useExtent, this._spatialOperator);
            });
            if (this.alias)
                this.set("title", this.alias);
            this.inherited(arguments);
            var properties = this.props;
            this._chartType = properties.chartType;
            this._useExtent = properties.useExtent;
            this._enableLegend = properties.enableLegend;
            this._enableChartSwitch = properties.enableChartSwitch;
            this._enableExtentSwitch = properties.enableExtentSwitch;
            this._spatialOperator = properties.spatialOperator;

            ct_css.switchHidden(this._legendContainer, !this._enableLegend);

            var chartSwitch = this._chartSwitch;
            ct_css.switchHidden(this._chartSwitchNode, !this._enableChartSwitch);
            if (this._chartType === "column") {
                chartSwitch.set("value", "off");
            } else if (this._chartType === "pie") {
                chartSwitch.set("value", "on");
            }

            var extentSwitch = this._extentSwitch;
            ct_css.switchHidden(this._extentSwitchNode, !this._enableExtentSwitch);
            if (this._useExtent === false) {
                extentSwitch.set("value", "off");
            } else if (this._useExtent === true) {
                extentSwitch.set("value", "on");
            }
            this._chart = new Chart(this._chartNode);
        },
        resize: function (dims) {
            this._container.resize(dims);
        },
        renderChart: function (data) {
            this.data = data;
            if (this._chartType === "column") {
                this._renderColumnChart(data);
            } else {
                this._renderPieChart(data);
            }
            this.resize();
        },
        _renderColumnChart: function (data) {
            if (this._chart) {
                this._chart.removePlot("default");
                var columnChart = this._chart;
                columnChart.setTheme(theme);
                columnChart.addAxis("x", {type: 'Invisible'});
                columnChart.addAxis("y", {
                    min: 0,
                    vertical: true,
                    fixLower: "major",
                    fixUpper: "major",
                    /*majorTickStep: 10,
                     minorTickStep: 1,
                     minorTicks: true,
                     microTicks: false,*/
                    natural: true,
                    fixed: true
                });
                for (var i = 0; i < data.length; i++) {
                    var s = data[i].name;
                    var tooltip = data[i].name + " [" + data[i].count + "]";
                    var d1 = [{x: 0, y: data[i].count, tooltip: tooltip}];
                    columnChart.addSeries(s, d1);
                }
                columnChart.addPlot("default", {
                    type: ClusteredColumns,
                    markers: false,
                    gap: 5,
                    animate: {duration: 1000, easing: d_easing.quadOut}
                });
                new Tooltip(columnChart, "default");
                new Highlight(columnChart, "default");
                columnChart.render();

                if (this.legend === undefined) {
                    this.legend = new Legend({chart: columnChart}, this.legendNode);
                } else {
                    this.legend.set("chart", columnChart);
                    this.legend.refresh();
                }

                this.connect(this._chartContainer, "resize", function (dims) {
                    var width = dims.w;
                    var height = dims.h;
                    this._chart.resize(width, height);
                });
            }
        },
        _renderPieChart: function (data) {
            if (this._chart) {
                this._chart.removePlot("default");

                var pieChart = this._chart;
                pieChart.setTheme(theme);
                pieChart.addPlot("default", {
                    type: Pie,
                    labels: true,
                    labelOffset: -20,
                    radius: 600,
                    fontColor: "black"
                });
                var a = [];
                for (var i = 0; i < data.length; i++) {
                    var tooltip = data[i].name + " [" + data[i].count + "]";
                    var d = {y: data[i].count, tooltip: tooltip, legend: data[i].name};
                    a.push(d);
                }
                pieChart.addSeries("", a);
                new Tooltip(pieChart, "default");
                new MoveSlice(pieChart, "default");
                pieChart.render();

                if (this.legend === undefined) {
                    this.legend = new Legend({chart: pieChart}, this.legendNode);
                } else {
                    this.legend.set("chart", pieChart);
                    this.legend.refresh();
                }

                this.connect(this._chartContainer, "resize", function (dims) {
                    var width = dims.w;
                    var height = dims.h;
                    //var size = Math.min(width, height);
                    //this._chart.resize(size, size);
                    this._chart.resize(width, height);
                });
            }
        },
        onRefresh: function () {
        },
        onNewData: function () {
        },
        onChangeChartType: function () {
        },
        onChangeExtentSetting: function () {
        },
        _onNewProperties: function () {
            ct_css.switchHidden(this._legendContainer, !this._enableLegend);

            var chartSwitch = this._chartSwitch;
            ct_css.switchHidden(this._chartSwitchNode, !this._enableChartSwitch);
            if (this._chartType === "column") {
                chartSwitch.set("value", "off");
            } else if (this._chartType === "pie") {
                chartSwitch.set("value", "on");
            }
            var extentSwitch = this._extentSwitch;
            ct_css.switchHidden(this._extentSwitchNode, !this._enableExtentSwitch);
            if (this._useExtent === false) {
                extentSwitch.set("value", "off");
            } else if (this._useExtent === true) {
                extentSwitch.set("value", "on");
            }
        }
    });
});
		