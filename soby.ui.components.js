// ********************* CAML BUILDER GRID *****************************
if($("#soby_gridstyle").length>0)
	$("#soby_gridstyle").remove();
document.write("<style type='text/css' id='soby_gridstyle'> \
        .soby_griddatarow.alt { background-color: #ededed } \
        .soby_griddatarow.selected { background-color: rgba( 156,206,240,0.5 ); } \
        .soby_tabletitle { font-weight: bold;font-size:14px;color:#0072C6;line-height:1.4 } \
        .soby_tabheader { float:left;padding:5px;background-color:#e6e6e6;margin-right:2px;border:1px solid #aaaaaa } \
        .soby_tabheader.active {background-color:white;border-bottom:0px solid} \
        .soby_tabcontent {border:1px solid #aaaaaa} \
    </style>");
var soby_DataGrids = new Array();

function soby_DataGrid(contentDivSelector, title, dataService, emptyDataHtml, webUrl) {
    this.GridID = "soby_grid_" + soby_guid();
    this.ContentDivSelector = contentDivSelector;
    this.Title = title;
    this.WebUrl = webUrl;
    this.DisplayTitle = true;
    this.DataService = dataService;
    this.EmptyDataHtml = emptyDataHtml;
    this.SortFieldName = "";
    this.IsAscending = true;
    this.FilterFieldName = "";
    this.FilterValue = "";
    this.PageIndex = 0;
    this.CellCount = 0;
    this.SelectedRowIDs = new Array();
    this.DataRelations = new Array();
    this.Columns = new Array();
    this.IsSelectable = true;
    this.Items = null;
    this.ItemCreated = null;
    this.ShowHeader = true;
    this.EventGridPopulated = null;
    this.EventRowSelected = null;
    this.EnsureGridExistency = function () {
        for (var key in soby_DataGrids) {
            if (key == this.GridID)
                return;
        }

        soby_DataGrids[this.GridID] = this;
    }

    this.EnsureGridExistency();

    this.AddColumn = function (fieldName, displayName, displayFunction, cellTemplate) {
        this.Columns[this.Columns.length] = { FieldName: fieldName, DisplayName: displayName, DisplayFunction: displayFunction, CellTemplate: cellTemplate };
    }
    this.AddDataRelation = function (masterFieldDisplayName, masterFieldValueName, detailGridID, detailFieldName) {
        this.DataRelations[this.DataRelations.length] = { MasterFieldDisplayName: masterFieldDisplayName, MasterFieldValueName: masterFieldValueName, DetailGridID: detailGridID, DetailFieldName: detailFieldName };
    }
    this.GetRowIds = function () {
        var rowIds = new Array();
        var rowsSelectors = $(this.ContentDivSelector + " .soby_griddatarow");
        for (var i = 0; i < rowsSelectors.length; i++) {
            rowIds[rowIds.length] = $(rowsSelectors[i]).attr("id");
        }

        return rowIds;
    }
    this.SelectRow = function (rowID) {
        this.SelectedRowIDs[this.SelectedRowIDs.length] = rowID;
        $(this.ContentDivSelector + " .soby_griddatarow").removeClass("selected");
        $("#" + rowID).addClass("selected");

        this.SelectDetailGridTab(rowID, 0);
        if(this.EventRowSelected != null)
        	this.EventRowSelected(rowID);
    }
    this.GenerateNavigationPane = function () {
        if (this.DataService.CanNavigateToNextPage() == false && this.DataService.CanNavigateToPreviousPage() == false)
            return "";

        var navigationPane = $(this.ContentDivSelector + " .navigationpane");
        navigationPane.html("<table style='margin:auto'><tbody><tr> \
							  " + (this.DataService.CanNavigateToPreviousPage() == true ? "<td><a href='javascript:void(0)' onclick=\"javascript:soby_DataGrids['" + this.GridID + "'].GoToPreviousPage()\"><img src='/_layouts/1033/images/prev.gif' border='0' alt='Previous'></a></td>" : "") + " \
							  <td class='ms-paging'>" + this.DataService.StartIndex + " - " + this.DataService.EndIndex + "</td> \
							  " + (this.DataService.CanNavigateToNextPage() == true ? "<td><a href='javascript:void(0)' onclick=\"javascript:soby_DataGrids['" + this.GridID + "'].GoToNextPage()\"><img src='/_layouts/1033/images/next.gif' border='0' alt='Next'></a></td>" : "") + " \
							  </tr></tbody></table>");
    }

    this.GoToNextPage = function () {
        this.PageIndex = this.PageIndex + 1;
        this.DataService.GoToPage(this.PageIndex);
    }

    this.GoToPreviousPage = function () {
        this.PageIndex = this.PageIndex - 1;
        this.DataService.GoToPage(this.PageIndex);
    }

    this.PopulateDetailGrid = function (detailGridID, contentDivSelector, fieldName, value) {
        soby_DataGrids[detailGridID].ContentDivSelector = contentDivSelector;
        soby_DataGrids[detailGridID].Initialize(false);
        soby_DataGrids[detailGridID].FilterResult(fieldName, value);
    }

    this.SelectDetailGridTab = function (rowid, index) {
        var rowSelector = $("tr[mainrowid='" + rowid + "']");
        rowSelector.find(".soby_tabheader").removeClass("active");
        rowSelector.find(".soby_tabheader[index='" + index + "']").addClass("active");
        rowSelector.find(".soby_tabcontent").hide();
        rowSelector.find(".soby_tabcontent[index='" + index + "']").show();
        $(this.ContentDivSelector + " .detailgridcell").hide();
        rowSelector.find(".detailgridcell").show();
    }

    this.ShowCellPopupContent = function (cellID) {
        $(this.ContentDivSelector + " .popup_content").hide();
        var cell = $("#" + cellID);
        var left = cell.position().left + 40;
        cell.find(".popup_content").css("left", left + "px");
        cell.find(".popup_content").show();
    }

    this.HideCellPopupContent = function (cellID) {
        $("#" + cellID + " .popup_content").hide();
    }

    this.FilterResult = function (fieldName, value) {
        this.FilterFieldName = fieldName;
        this.FilterValue = value;
        this.DataService.Filter(fieldName, value, true);
    }

    this.SortResult = function (sortFieldName, isAsc) {
        this.SortFieldName = sortFieldName;
        this.IsAscending = isAsc;
        this.DataService.Sort(sortFieldName, isAsc);
    }

    this.AddHeaderCell = function (headerRow, column, dataRelation) {
        var fieldName = "";
        var displayName = "";
        var sortable = false;

        if (column != null) {
            fieldName = column.FieldName;
            displayName = column.DisplayName;
            if (column.CellTemplate == null || column.CellTemplate == "")
                sortable = true;
        }
        else {
            sortable = true;
            fieldName = dataRelation.MasterFieldValueName;
            displayName = dataRelation.MasterFieldDisplayName;
        }

        var headerLink = $("<a href='javascript:void(0)' onclick=\"javascript:soby_DataGrids['" + this.GridID + "'].SortResult('" + fieldName + "', true)\">" + displayName + "</a>");
        if (sortable == false) {
            headerLink = $("<span>" + displayName + "</span>");
        }
        else if (fieldName == this.SortFieldName) {
            if (this.IsAscending == true) {
                headerLink = $("<a href='javascript:void(0)' onclick=\"javascript:soby_DataGrids['" + this.GridID + "'].SortResult('" + fieldName + "', false)\">" + displayName + " <img border='0' alt='Sort Ascending' src='/_layouts/images/sort.gif'></a>");
            }
            else {
                headerLink = $("<a href='javascript:void(0)' onclick=\"javascript:soby_DataGrids['" + this.GridID + "'].SortResult('" + fieldName + "', true)\">" + displayName + " <img border='0' alt='Sort Descending' src='/_layouts/images/rsort.gif'></a>");
            }
        }

        var headerCell = $("<th style='padding:5px;' nowrap='' scope='col' onmouseover='OnChildColumn(this)' class='ms-vh2'></th>").append(headerLink);
        headerRow.append(headerCell);
    }

    this.PopulateHeaderCells = function () {
        var headerRow = $(this.ContentDivSelector + " .soby_gridheaderrow");
        headerRow.find("th").remove();

        if (this.IsSelectable == true)
        headerRow.append("<th>&nbsp;</th>");

        for (var i = 0; i < this.Columns.length; i++) {
            this.AddHeaderCell(headerRow, this.Columns[i], null);
        }
    }

    this.Initialize = function (populateItems) {
        var cellCount = 0;
        for (var i = 0; i < this.Columns.length; i++) {
            cellCount++;
        }
        this.CellCount = cellCount;

        var table = $("<table width='100%' class='soby_grid'></table>");
        var headerRow = $("<tr class='soby_gridheaderrow'></tr>");

        var loadingRow = $("<tr class='loadingrow' style='display:none'></tr>");
        loadingRow.append("<td colspan='" + this.CellCount + "'><img src='/_layouts/images/loading16.gif'> Loading...</td>");

        var navigationRow = $("<tr></tr>");
        navigationRow.append("<td class='navigationpane' colspan='" + this.CellCount + "'></td>");

        table.append(headerRow);
        table.append(loadingRow);
        table.append(navigationRow);

        $(this.ContentDivSelector).html("");
        if (this.DisplayTitle == true) {
            var tableTitle = $("<div class='soby_tabletitle'></div>").text(this.Title);
            $(this.ContentDivSelector).append(tableTitle);
        }
        $(this.ContentDivSelector).append(table);

        var grid = this;
        this.DataService.ItemPopulated = function (items) {
            grid.PopulateGridData(items);
        }

        this.DataService.ItemBeingPopulated = function () {
            $(grid.ContentDivSelector + " .loadingrow").show();
        }

        if (populateItems == true)
            this.DataService.PopulateItems();
    }

    this.PopulateGridData = function (items) {
	    this.Items = items;
        if (this.ShowHeader == true)
            this.PopulateHeaderCells();

        var table = $(this.ContentDivSelector + " .soby_grid");
        $(this.ContentDivSelector + " .soby_griddatarow").remove();
        $(this.ContentDivSelector + " .soby_griddetailrow").remove();
        var navigationRow = $(this.ContentDivSelector + " .navigationpane").parent();

        for (var i = 0; i < items.length; i++) {
            var rowID = "soby_griddatarow_" + soby_guid();
            var row = $("<tr class='soby_griddatarow'></tr>");
			if(i%2 == 0)
				row.addClass("alt");
            row.attr("id", rowID);
            var item = items[i];

            var onClick = "soby_DataGrids['" + this.GridID + "'].SelectRow('" + rowID + "');";
            for (var t = 0; t < this.DataRelations.length; t++) {
                var dataRelation = this.DataRelations[t];
                var value = item[dataRelation.MasterFieldValueName];
                onClick += "soby_DataGrids['" + this.GridID + "'].PopulateDetailGrid('" + dataRelation.DetailGridID + "','#" + rowID + "_" + dataRelation.DetailGridID + "', '" + dataRelation.DetailFieldName + "', '" + value + "');";
            }

            if (this.IsSelectable == true) {
				var link = $("<a href='javascript:void(0)'>+</a>");
                link.attr("onclick", onClick);
            var cell = $("<td valign='top' style='padding:5px;' width='20px'></td>").append(link);
            row.append(cell);
            }


            for (var x = 0; x < this.Columns.length; x++) {
                if (this.Columns[x].IsVisible == false)
                    continue;

                var cellID = "soby_gridcell_" + soby_guid();

                var contentHtml = "";
                if (this.Columns[x].DisplayFunction != null) {
                    contentHtml = this.Columns[x].DisplayFunction(item);
                }
                else if (this.Columns[x].CellTemplate != null) {
                    contentHtml = this.Columns[x].CellTemplate.Template;
                    var propertyNames = this.DataService.GetPropertyNames();
                    for (var n = 0; n < propertyNames.length; n++) {
                        var value = item[propertyNames[n].PropertyName]
                        var regex = new RegExp('#{' + propertyNames[n].PropertyName + '}', 'ig');
                        contentHtml = contentHtml.replace(regex, value);
                    }

                    if (this.Columns[x].CellTemplate.TemplateType == "CellContent") {
                    }
                    else if (this.Columns[x].CellTemplate.TemplateType == "PopupContent") {
                        var popupLinkText = this.Columns[x].CellTemplate.PopupLinkText;
                        var popup_link = $("<a href='javascript:void(0)'></a>").text(popupLinkText);
                        popup_link.attr("onclick", "soby_DataGrids['" + this.GridID + "'].ShowCellPopupContent('" + cellID + "')");
                        var popup_contentPanel = $("<div style='display:none;position: absolute;padding: 10px;border: 1px solid;background-color: white;padding-top: 0px;overflow: auto;height:90%;width:50%' class='popup_content'></div>");

                        popup_contentPanel.append("<div style='text-align: right;position: fixed;margin-left: 43.5%;border: 1px solid;padding: 5px;'><a href='javascript:void(0)' onclick=\"soby_DataGrids['" + this.GridID + "'].HideCellPopupContent('" + cellID + "')\">x</a></div>");
                        popup_contentPanel.append(contentHtml);
                        var popup_mainContentPanel = $("<div></div>");
                        popup_mainContentPanel.append(popup_link);
                        popup_mainContentPanel.append(popup_contentPanel);
                        contentHtml = popup_mainContentPanel.html();
                    }
                }
                else {
                    contentHtml = item[this.Columns[x].FieldName];
                }

                var cell = $("<td valign='top' style='padding:5px;'></td>").html(contentHtml);
                cell.attr("id", cellID);

                row.append(cell);
            }
            navigationRow.before(row);

            if (this.ItemCreated != null)
                this.ItemCreated(rowID, item);

            if (this.DataRelations.length == 0)
                continue;

            var row = $("<tr class='soby_griddetailrow'></tr>");
            row.attr("mainrowid", rowID);
            var cell = $("<td colspan='" + this.CellCount + "' class='detailgridcell' style='display:none'></td>");

            var tabHeaderPanel = $("<div class='soby_gridtabheaderpanel'></div>")
            for (var t = 0; t < this.DataRelations.length; t++) {
                var dataRelation = this.DataRelations[t];
                tabHeaderPanel.append("<div class='soby_tabheader' index='" + t + "'><a href='javascript:void(0)' onclick=\"soby_DataGrids['" + this.GridID + "'].SelectDetailGridTab('" + rowID + "', '" + t + "')\">" + soby_DataGrids[dataRelation.DetailGridID].Title + "</a></div>")
                var panel = $("<div style='display:none' class='soby_tabcontent'></div>");
                panel.attr("id", rowID + "_" + dataRelation.DetailGridID);
                panel.attr("index", t);
                /*
				panel.attr("masterfieldvaluename", dataRelation.MasterFieldValueName);
				panel.attr("masterfielddisplayname", dataRelation.MasterFieldDisplayName);
				panel.attr("detailgridid", dataRelation.DetailGridID);
				panel.attr("detailfieldname", dataRelation.DetailFieldName);
				*/
                cell.append(panel);
            }
            cell.prepend(tabHeaderPanel);
            row.append("<td></td>");
            row.append(cell);
            navigationRow.before(row);
        }

        $(this.ContentDivSelector + " .loadingrow").hide();
	    if (items.length == 0) {
	        $(this.ContentDivSelector).html(this.EmptyDataHtml);
	    }

        this.GenerateNavigationPane();
        if (this.EventGridPopulated != null)
            this.EventGridPopulated();
    }
}
// ************************************************************

// ********************* CAML BUILDER CAROUSEL *****************************
if($("#soby_carouselstyle").length>0)
	$("#soby_carouselstyle").remove();
document.write("<style type='text/css' id='soby_carouselstyle'> \
	.soby_carousel {position: relative;} \
	.soby_carousel .carousel-inner>.item {display:none} \
	.soby_carousel .carousel-inner>.item.active {display:block} \
	.soby_carousel .next, .soby_carousel .prev { color: #333;display: inline-block; font: normal bold 4em Arial,sans-serif; overflow: hidden; position: relative; text-decoration: none; width: auto; padding: 0.5em 1.5em; text-align: right } \
    .soby_carousel .next:before, .soby_carousel .next:after, .soby_carousel .prev:before, .soby_carousel .prev:after { background: #333;-moz-border-radius: 0.25em;-webkit-border-radius: 0.25em; border-radius: 0.25em;content: '';display: block;height: 0.5em;position: absolute;right: 0;top: 50%;width: 1em; } \
    .soby_carousel .prev:before, .soby_carousel .prev:after { left: 0 } \
	.soby_carousel .next:before, .soby_carousel .prev:before {-moz-transform: rotate(45deg);-ms-transform: rotate(45deg);-o-transform: rotate(45deg);-webkit-transform: rotate(45deg); transform: rotate(45deg);} \
	.soby_carousel .next:after, .soby_carousel .prev:after {-moz-transform: rotate(-45deg);-ms-transform: rotate(-45deg);-o-transform: rotate(-45deg);-webkit-transform: rotate(-45deg);transform: rotate(-45deg);} \
	.soby_carousel .prev:after, .soby_carousel .next:before { margin-top: -.36em } \
	.soby_carousel .next:hover, .soby_carousel .next:focus, .soby_carousel .prev:hover, .soby_carousel .prev:focus { color: #c00 }\
	.soby_carousel .next:hover:before, .soby_carousel .next:hover:after, .soby_carousel .next:focus:before, .soby_carousel .next:focus:after, .soby_carousel .prev:hover:before, .soby_carousel .prev:hover:after, .soby_carousel .prev:focus:before, .soby_carousel .prev:focus:after { background: #c00 } \
	.soby_carousel .prev { position: absolute;top: 0;bottom: 0;left: 0; } \
	.soby_carousel .next { position: absolute;top: 0;bottom: 0;right: 0; } \
	.soby_carousel .carousel-caption { right: 20%; left: 20%;padding-bottom: 30px; position: absolute;bottom: 20px; } \
	.soby_carousel .carouselimage {width:100%} \
	.soby_carousel .carousel-caption h3{ color: white; font-weight: bold; font-size: 25px; } \
	.soby_carousel .carousel-indicators{position: absolute;bottom: 10px;left: 50%;z-index: 15; width: 60%;padding-left: 0;margin-left: -30%;text-align: center;list-style: none;} \
	.soby_carousel .carouselindicator{ margin-right:5px;display: inline-block;width: 10px;height: 10px;margin: 1px;text-indent: -999px;cursor: pointer;background-color: #000 \9;background-color: rgba(0,0,0,0);border: 1px solid #fff;border-radius: 10px; } \
	.soby_carousel .carouselindicator.active{left: 0;-webkit-transform: translate3d(0,0,0);transform: translate3d(0,0,0);background-color: #777} \
	</style>");
var soby_Carousels = new Array();
function soby_Carousel(contentDivSelector, title, dataService, emptyDataHtml, webUrl, imageFieldName, captionFieldName, contentFieldName, isContentFieldUrl) {
    this.CarouselID = "soby_carousel_" + soby_guid();
    this.ContentDivSelector = contentDivSelector;
    this.Title = title;
    this.WebUrl = webUrl;
    this.DataService = dataService;
    this.EmptyDataHtml = emptyDataHtml;
    this.ImageFieldName = imageFieldName;
    this.CaptionFieldName = captionFieldName;
    this.ContentFieldName = contentFieldName;
    this.IsContentFieldUrl = isContentFieldUrl;
    this.MaxWidth = null;
    this.Items = null;
    this.EnsureCarouselExistency = function () {
        for (var key in soby_Carousels) {
            if (key == this.CarouselID)
                return;
        }

        soby_Carousels[this.CarouselID] = this;
    }

    this.EnsureCarouselExistency();

    this.GoToItem = function (index) {
        $(this.ContentDivSelector + " .carouselindicator").removeClass("active");
        $(this.ContentDivSelector + " .item").removeClass("active");
        $(this.ContentDivSelector + " .item[index='" + index + "']").addClass("active");
        $(this.ContentDivSelector + " .carouselindicator[index='" + index + "']").addClass("active");
    }

    this.NextItem = function () {
        var currentIndex = Math.round($(this.ContentDivSelector + " .item.active").attr("index"));
        $(this.ContentDivSelector + " .item").removeClass("active");
        $(this.ContentDivSelector + " .carouselindicator").removeClass("active");
        var index = currentIndex + 1;
        if (index >= this.Items.length)
            index = 0;
        $(this.ContentDivSelector + " .item[index='" + index + "']").addClass("active");
        $(this.ContentDivSelector + " .carouselindicator[index='" + index + "']").addClass("active");
    }

    this.PreviousItem = function () {
        var currentIndex = Math.round($(this.ContentDivSelector + " .item.active").attr("index"));
        $(this.ContentDivSelector + " .item").removeClass("active");
        $(this.ContentDivSelector + " .carouselindicator").removeClass("active");
        var index = currentIndex - 1;
        if (index < 0)
            index = this.Items.length - 1;
        $(this.ContentDivSelector + " .item[index='" + index + "']").addClass("active");
        $(this.ContentDivSelector + " .carouselindicator[index='" + index + "']").addClass("active");
    }

    this.PopulateIndicators = function (contentDivID, items) {
        var indicatorsOL = $("<ol class='carousel-indicators'></ol>");
        for (var i = 0; i < items.length; i++) {
            //        <a href='javascript:void(0)' onclick=\"soby_Carousels['" + this.CarouselID + "'].GoToItem(" + i + ")\">" + (i + 1) + "</a>
            indicatorsOL.append("<li class='carouselindicator' index='" + i + "' onclick=\"soby_Carousels['" + this.CarouselID + "'].GoToItem(" + i + ")\"></li>");
        }

        $("#" + contentDivID).append(indicatorsOL);
    }

    this.PopulateItems = function (contentDivID, items) {
        var itemsDiv = $("<div class='carousel-inner'></div>");
        for (var i = 0; i < items.length; i++) {
            var itemDiv = $("<div class='item'></div>");
            itemDiv.attr("index", i);

            var imageSrc = items[i][this.ImageFieldName];
            var caption = items[i][this.CaptionFieldName];
            var image = $("<img alt='...' class='carouselimage'>");
            image.attr("src", imageSrc);
            itemDiv.append(image);
            var captionDiv = $("<div class='carousel-caption'></div>");
            var h3 = $("<h3></h3>");
            h3.html(caption);
            captionDiv.append(h3);
            itemDiv.append(captionDiv);
            itemsDiv.append(itemDiv);
        }

        $("#" + contentDivID).append(itemsDiv);
    }

    this.PopulateNavigator = function (contentDivID) {
        $("#" + contentDivID).append("<a class='prev' href='#" + contentDivID + "' role='button' data-slide='prev' onclick=\"soby_Carousels['" + this.CarouselID + "'].PreviousItem()\"></a> \
			  <a class='next' href='#" + contentDivID + "' role='button' data-slide='next' onclick=\"soby_Carousels['" + this.CarouselID + "'].NextItem()\"></a>");
    }

    this.PopulateGridData = function (items) {
        $("#" + this.CarouselID).html("");
        this.Items = items;
        this.PopulateIndicators(this.CarouselID, this.Items);
        this.PopulateItems(this.CarouselID, this.Items);
        this.PopulateNavigator(this.CarouselID);
        this.GoToItem(0)
    }

    this.Initialize = function (populateItems) {
        var carouselDivID = this.CarouselID;
        var carouselDiv = $("<div class='soby_carousel slide' data-ride='carousel' id='" + carouselDivID + "'></div>");
        if (this.MaxWidth != null && this.MaxWidth != "")
            carouselDiv.css("max-width", this.MaxWidth);

        $(this.ContentDivSelector).html("");
        $(this.ContentDivSelector).append(carouselDiv);

        var carousel = this;
        this.DataService.ItemPopulated = function (items) {
            carousel.PopulateGridData(items);
        }

        this.DataService.ItemBeingPopulated = function () {
            $("#" + carouselDivID).html("<img src='/_layouts/images/loading16.gif'> Loading...");
        }

        if (populateItems == true)
            this.DataService.PopulateItems();
    }
}
// ************************************************************

// ********************* CAML BUILDER METRO TILES *****************************
if($("#soby_metrostyle").length>0)
	$("#soby_metrostyle").remove();
document.write("<style type='text/css' id='soby_metrostyle'> \
	.metro-tiles {background-color:#180053;display:table} \
	.metro-tile {float: left;margin:5px;text-align: center;} \
	.metro-tile:hover {border:2px solid;margin:3px;cursor:pointer} \
	.metro-tilecaption a {color:white} \
	</style>");
var soby_MetroTileGrids = new Array();
function soby_MetroTilesGrid(contentDivSelector, title, dataService, emptyDataHtml, webUrl, imageFieldName, captionFieldName, urlFieldName, openInNewWindowFieldName, startColorFieldName, endColorFieldName, colspanFieldName, rowspanFieldName) {
    this.MetroTileGridID = "soby_metrotilegrid_" + soby_guid();
    this.ContentDivSelector = contentDivSelector;
    this.Title = title;
    this.WebUrl = webUrl;
    this.DataService = dataService;
    this.EmptyDataHtml = emptyDataHtml;
    this.ImageFieldName = imageFieldName;
    this.CaptionFieldName = captionFieldName;
    this.URLFieldName = urlFieldName;
    this.OpenInNewWindowFieldName = openInNewWindowFieldName;
    this.StartColorFieldName = startColorFieldName;
    this.EndColorFieldName = endColorFieldName;
    this.RowSpanFieldName = rowspanFieldName;
    this.ColSpanFieldName = colspanFieldName;
    this.MaxWidth = null;
    this.TileWidth = "150";
    this.TileHeight = "120";
    this.Width = "600";
    this.Items = null;
    this.EnsureMetroTilesExistency = function () {
        for (var key in soby_MetroTileGrids) {
            if (key == this.MetroTileGridID)
                return;
        }

        soby_MetroTileGrids[this.MetroTileGridID] = this;
    }

    this.EnsureMetroTilesExistency();


    this.PopulateItems = function (items) {
        var itemsDiv = $("<div class='metro-tiles' style='width:" + this.Width + "'></div>");
        for (var i = 0; i < items.length; i++) {
            var imageSrc = items[i][this.ImageFieldName];
            if (imageSrc.indexOf(",") > -1)
                imageSrc = imageSrc.split(",")[0];

            var caption = items[i][this.CaptionFieldName];
            var url = items[i][this.URLFieldName];
            if (url.indexOf(",") > -1)
                url = url.split(",")[0];
            var openInNewWindow = items[i][this.OpenInNewWindowFieldName];
            var startColor = items[i][this.StartColorFieldName];
            var endColor = items[i][this.EndColorFieldName];
            var rowspan = Math.round(items[i][this.RowSpanFieldName]);
            if (isNaN(rowspan) == true)
                rowspan = 1;
            var colspan = Math.round(items[i][this.ColSpanFieldName]);
            if (isNaN(colspan) == true)
                colspan = 1;

            var tileWidth = this.TileWidth * colspan + (10 * (colspan - 1));
            var tileHeight = this.TileHeight * rowspan + (10 * (rowspan - 1));

            var itemDiv = $("<div class='metro-tile'></div>");
            //background: -webkit-linear-gradient(left, red , blue); /* For Safari 5.1 to 6.0 */
            //background: -o-linear-gradient(right, red, blue); /* For Opera 11.1 to 12.0 */
            //background: -moz-linear-gradient(right, red, blue); /* For Firefox 3.6 to 15 */
            //background: linear-gradient(to right, red , blue); /* Standard syntax */
            itemDiv.css("background", "linear-gradient(to right, " + startColor + "," + endColor + ")");
            itemDiv.attr("index", i);
            itemDiv.css("width", tileWidth + "px");
            itemDiv.css("height", tileHeight + "px");

            var link = $("<a></a>");
            link.attr("href", url);
            if (openInNewWindow == "1")
                link.attr("target", "_blank");

            var image = $("<img alt='...' class='metro-tileimage'>");
            image.attr("src", imageSrc);
            link.append(image);
            itemDiv.append(link);
            var captionDiv = $("<div class='metro-tilecaption'></div>");
            var link = $("<a></a>");
            link.attr("href", url);
            link.text(caption);
            if (openInNewWindow == "1")
                link.attr("target", "_blank");

            captionDiv.append(link);
            itemDiv.append(captionDiv);
            itemsDiv.append(itemDiv);
        }

        $("#" + this.MetroTileGridID).append(itemsDiv);
    }


    this.Initialize = function (populateItems) {
        var metroTileGridDiv = $("<div class='soby_metrotilegrid' id='" + this.MetroTileGridID + "'></div>");
        if (this.MaxWidth != null && this.MaxWidth != "")
            metroTileGridDiv.css("max-width", this.MaxWidth);

        $(this.ContentDivSelector).html("");
        $(this.ContentDivSelector).append(metroTileGridDiv);

        var metroTileGrid = this;
        this.DataService.ItemPopulated = function (items) {
            metroTileGrid.PopulateItems(items);
        }

        this.DataService.ItemBeingPopulated = function () {
            $("#" + this.MetroTileGridID).html("<img src='/_layouts/images/loading16.gif'> Loading...");
        }

        if (populateItems == true)
            this.DataService.PopulateItems();
    }

}
// ************************************************************


// ********************* CAML BUILDER GRID *****************************
if($("#soby_folderexplorerstyle").length>0)
	$("#soby_folderexplorerstyle").remove();
document.write("<style type='text/css' id='soby_folderexplorerstyle'> \
				.fnfolder.selected > a {font-weight:bold} \
			    </style>");
var soby_FolderExplorers = new Array();

function soby_FolderNavigator(folderExplorerID, title, listName, folderUrl, emptyDataHtml, webUrl){
	this.FolderExplorerID = folderExplorerID;
	this.Title = title;
	this.ListName = listName;
    this.RootFolderUrl = folderUrl;
	this.SelectedFolderUrl = folderUrl;
	this.EmptyDataHtml = emptyDataHtml;
	this.WebUrl = webUrl;
    this.Initialize = function () {
        var ul = $("<ul></ul>");
      	var li = $("<li class='fnfolder' style='list-style-type: none;'></li>").attr("url", this.RootFolderUrl);
		
		var link1 = $("<a href='javascript:void(0)' class='fnfolderexpand'></a>").html("<img src='/_layouts/images/expand.gif' border='0'>").attr("onclick", "soby_FolderExplorers['" + folderExplorerID + "'].ExpandFolder('" + this.RootFolderUrl + "')");
		var link2 = $("<a href='javascript:void(0)' class='fnfolderselect'></a>").html("<img src='/_layouts/images/folder.gif' border='0'>&nbsp;" + listName).attr("onclick", "soby_FolderExplorers['" + folderExplorerID + "'].SelectFolder('" + this.RootFolderUrl + "')");
		var span = li.html("").append(link1).append(" ").append(link2);
		ul.append(li);
	    $(soby_FolderExplorers[folderExplorerID].ContentDivSelector).find(".foldernavigator").append(ul);
	}
	
	this.ExpandFolder = function(folderUrl, isSelectAction){
		var currentFolderLink = $(soby_FolderExplorers[this.FolderExplorerID].ContentDivSelector).find(".fnfolder[url='" + folderUrl + "']");

		if(currentFolderLink.hasClass("expanded") == false){
	  	    currentFolderLink.addClass("expanded");
			currentFolderLink.find("> .fnfolderexpand img").attr("src", "/_layouts/images/COLLAPSE.gif") ;
			currentFolderLink.find("> ul").show();
		}
		else if(isSelectAction == false){
	  	    currentFolderLink.removeClass("expanded");
			currentFolderLink.find("> .fnfolderexpand img").attr("src", "/_layouts/images/expand.gif") 
			currentFolderLink.find("> ul").hide();
		}

		if(currentFolderLink.hasClass("childloaded") == false){
		    var camlBuilder = new soby_CamlBuilder(this.ListName, "", 1000);
		    camlBuilder.Filters = new CamlFilters(false);
		    camlBuilder.IsRecursive = true;
		    camlBuilder.AddViewField("ID", "ID", CamlFieldTypes.Number);
		    camlBuilder.AddViewField("LinkFilename", "LinkFilename", CamlFieldTypes.Text);
		    camlBuilder.Filters.AddFilter("FSObjType", "1", CamlFieldTypes.Text, CamlFilterTypes.Equal);
		    camlBuilder.Filters.AddFilter("FileDirRef", folderUrl, CamlFieldTypes.Text, CamlFilterTypes.Equal);
	
		    var mainSoapEnvelope = camlBuilder.GetMainSoapEnvelope();
	
	  	    currentFolderLink.addClass("childloaded");
		    soby_GetSPWSData(mainSoapEnvelope,
		      function (result, args) {
		      	  var folderExplorerID = args[0];
		      	  var selectedFolderUrl = args[1];
	
		          var items = camlBuilder.ParseData(result);
		          
		          var ul = $("<ul></ul>");
		          for(var i=0;i<items.length;i++){
					var folderUrl = selectedFolderUrl + "/" + items[i].LinkFilename;
		          	var li = $("<li class='fnfolder' style='list-style-type: none;'></li>").attr("url", folderUrl);
					var listName = items[i].LinkFilename;
					
					var link1 = $("<a href='javascript:void(0)' class='fnfolderexpand'></a>").html("<img src='/_layouts/images/expand.gif' border='0'>").attr("onclick", "soby_FolderExplorers['" + folderExplorerID + "'].ExpandFolder('" + folderUrl + "', false)");
					var link2 = $("<a href='javascript:void(0)' class='fnfolderselect'></a>").html("<img src='/_layouts/images/folder.gif' border='0'>" + listName).attr("onclick", "soby_FolderExplorers['" + folderExplorerID + "'].SelectFolder('" + folderUrl + "')");
					var span = li.html("").append(link1).append(" ").append(link2);
	
					ul.append(li);
		          }
		          
		          $(soby_FolderExplorers[folderExplorerID].ContentDivSelector).find(".fnfolder[url='" + selectedFolderUrl + "']").append(ul);
		      },
		      function (XMLHttpRequest, textStatus, errorThrown) {
		          $("#" + loadingDivID).html("<img title='" + errorThrown + "' src='/_layouts/images/error16by16.gif'> An error occured");
		          UNFCCC_LogServiceError("Error thrown for call for submission find as follow", textStatus, errorThrown);
		      }, null, true, this.WebUrl, [this.FolderExplorerID, folderUrl]);
		}
    }

	this.SelectFolder = function(folderUrl){
		$(soby_FolderExplorers[this.FolderExplorerID].ContentDivSelector).find(".fnfolder").removeClass("selected");
		var currentFolderLink = $(soby_FolderExplorers[this.FolderExplorerID].ContentDivSelector).find(".fnfolder[url='" + folderUrl + "']");
  	    currentFolderLink.addClass("selected");
    }

}


function soby_FolderExplorerActionBar(folderExplorerID, title, listName, folderUrl, emptyDataHtml, webUrl){
	this.FolderExplorerID = folderExplorerID;
	this.Title = title;
	this.ListName = listName;
    this.RootFolderUrl = folderUrl;
	this.SelectedFolderUrl = folderUrl;
	this.EmptyDataHtml = emptyDataHtml;
	this.WebUrl = webUrl;
    this.SelectFolder = function(folderUrl){
    	this.SelectedFolderUrl = folderUrl;
        $(soby_FolderExplorers[folderExplorerID].ContentDivSelector).find(".breadcrumb").html(this.SelectedFolderUrl);
    }
    this.Initialize = function (populateItems) {
			var container = $("<div class='row-fluid'>" +
				                "<div class='span12'>" +
				                    "<p>" +
				                        "</p><div class='refreshSelectorClass btn icn-only tooltips' data-placement='top' data-original-title='Refresh View'>" +
				                            "<i class='icon-refresh'></i>" +
				                        "</div>" +
				                        "<div class='expandSelectorClass btn icn-only tooltips' data-placement='top' data-original-title='Expand Folders'>" +
				                            "<i class='icon-expand'></i>" +
				                        "</div>" +
				                        "<div class='colapseSelectorClass btn icn-only tooltips' data-placement='top' data-original-title='Collapse Folders'>" +
				                            "<i class='icon-collapse'></i>" +
				                        "</div>" +
				                        "<div data-parentweb='General Working Space' class='zipDonwloadSelectorClass btn icn-only tooltips' data-placement='top' data-original-title='Download as ZIP'>" +
				                            "<i class='icon-download-alt'></i>" +
				                        "</div>" +
				                        "<div class='createFolderSelectorClass btn icn-only tooltips' data-placement='top' data-original-title='Create Folder'>" +
				                            "<i class='icon-folder-close'></i>" +
				                        "</div>" +
				                         "<div class='multiUploadSelectorClass btn icn-only tooltips' data-placement='top' data-original-title='Upload multiple files'>" +
				                            "<i class='icon-upload-alt'></i>" +
				                        "</div>" +
				                        "<div style='' class='deleteSelectorClass btn icn-only tooltips' data-placement='top' data-original-title='Delete'>" +
				                           " <i class='icon-trash'></i>" +
				                        "</div>" +
				                    "<p></p>" +
				                "</div>" +
				            "</div>");
			var container = $("");
        $(soby_FolderExplorers[folderExplorerID].ContentDivSelector).find(".action-bar").append(container);
        $(soby_FolderExplorers[folderExplorerID].ContentDivSelector).find(".breadcrumb").html(this.SelectedFolderUrl);
        
    }
}

function soby_FolderBrowser(folderExplorerID, title, listName, folderUrl, emptyDataHtml, webUrl){
	this.FolderExplorerID = folderExplorerID;
	this.Title = title;
	this.ListName = listName;
    this.RootFolderUrl = folderUrl;
	this.SelectedFolderUrl = folderUrl;
	this.EmptyDataHtml = emptyDataHtml;
	this.WebUrl = webUrl;
	this.NavigateToFolder = function(folderUrl){
		this.SelectedFolderUrl = folderUrl;
		this.Initialize(true);
	}
    this.Initialize = function (populateItems) {
	    var dataSourceBuilder = new soby_CamlBuilder(this.ListName, "", 0, this.WebUrl);
	    dataSourceBuilder.Filters = new CamlFilters(false);
	    dataSourceBuilder.IsRecursive = true;
	    dataSourceBuilder.AddViewField("ID", "ID", CamlFieldTypes.Number);
	    dataSourceBuilder.AddViewField("LinkFilename", "LinkFilename", CamlFieldTypes.Text);
	    dataSourceBuilder.AddViewField("FileRef", "FileRef", CamlFieldTypes.Text);
	    dataSourceBuilder.AddViewField("Modified", "Modified", CamlFieldTypes.Text);
	    dataSourceBuilder.AddViewField("Editor", "Editor", CamlFieldTypes.User);
		dataSourceBuilder.Filters.AddFilter("FSObjType", "0", CamlFieldTypes.Text, CamlFilterTypes.Equal);
	    dataSourceBuilder.Filters.AddFilter("FileDirRef", this.SelectedFolderUrl, CamlFieldTypes.Text, CamlFilterTypes.Equal);

	    var spService = new soby_SharePointService(dataSourceBuilder);
	    var gridSelectorString = soby_FolderExplorers[folderExplorerID].ContentDivSelector + " .folderbrowser";
	    var grid = new soby_DataGrid(gridSelectorString, "", spService, "There is no record found.");
		grid.IsSelectable = false;
	    grid.AddColumn("Name", "Name", function(item){
	    	var url = grid.DataService.CamlBuilder.WebUrl + "/" + item.FileRef.split(";#")[1];
	    	return "<a href='" + url + "'>" + item.LinkFilename + "</a>";
	    } );
	    grid.AddColumn("Modified", "Modified");
	    grid.AddColumn("Editor", "Modified By", function(item){
	    	return item.Editor.split(";#")[1];
	    } );
	
	    grid.EventGridPopulated = function(){
	    }
	    grid.Initialize(true);
    }
}

function soby_FolderExplorer(contentDivSelector, title, listName, folderUrl, emptyDataHtml, webUrl) {
    this.GridID = "soby_grid_" + soby_guid();
    this.ContentDivSelector = contentDivSelector;
    this.Title = title;
    this.WebUrl = webUrl;
    this.DisplayTitle = true;
    this.ListName = listName;
    this.RootFolderUrl = folderUrl;
    this.SelectedFolderUrl = folderUrl;
    this.EmptyDataHtml = emptyDataHtml;
    this.SortFieldName = "";
    this.IsAscending = true;
    this.FilterFieldName = "";
    this.FilterValue = "";
    this.PageIndex = 0;
    this.CellCount = 0;
    this.SelectedRowIDs = new Array();
    this.DataRelations = new Array();
    this.Columns = new Array();
    this.IsSelectable = true;
    this.Items = null;
    this.ItemCreated = null;
    this.ShowHeader = true;
    this.EventGridPopulated = null;
    this.FolderNavigator = new soby_FolderNavigator(this.GridID, this.Title, this.ListName, this.RootFolderUrl, "", this.WebUrl);
    this.FolderBrowser = new soby_FolderBrowser(this.GridID, this.Title, this.ListName, this.RootFolderUrl, "", this.WebUrl);
    this.FolderExplorerActionBar = new soby_FolderExplorerActionBar(this.GridID, this.Title, this.ListName, this.RootFolderUrl, "", this.WebUrl);
    this.SelectFolder = function(folderUrl){
    	this.SelectedFolderUrl = folderUrl;
    	this.FolderBrowser.NavigateToFolder(this.SelectedFolderUrl);
    	this.FolderExplorerActionBar.SelectFolder(this.SelectedFolderUrl);
    	this.FolderNavigator.ExpandFolder(this.SelectedFolderUrl, true)
    	this.FolderNavigator.SelectFolder(this.SelectedFolderUrl)
    }
    this.ExpandFolder = function(folderUrl, isSelectAction){
    	this.FolderNavigator.ExpandFolder(folderUrl, isSelectAction)
    }
    this.EnsureGridExistency = function () {
        for (var key in soby_FolderExplorers) {
            if (key == this.GridID)
                return;
        }

        soby_FolderExplorers[this.GridID] = this;
    }

    this.EnsureGridExistency();

    this.Initialize = function (populateItems) {
    	var mainContainer = $("<div class='portlet box dark-blue'>" +
							    "<div class='portlet-title'>" +
							        "<div class='caption'>" +
							            "<i class='icon-reorder'></i>" + this.Title + "</div>" +
							        "<div class='tools'>" +
							            "<a class='collapse' href='javascript:;'></a>" +
							        "</div>" +
							    "</div>" +
							    "<div class='portlet-body'>" +
								    "<div class='action-bar'>" +
							        "</div>" +
							        "<div class='row-fluid'>" +
							            "<div class='span12'>" +
							                "<div class='breadcrumb'>" +
									        "</div>" +
							                "<div style='width:100%'>" +
							                	"<table width='100%'><tr>" +
								                "<td valign='top' class='foldernavigator'></td>" +
								                "<td valign='top' class='folderexplorerseperator'></td>" +
								                "<td valign='top' class='folderbrowser'></td>" +
								                "</tr></table>" +
									        "</div>" +
								        "</div>" +
							        "</div>" +
							    "</div>" +
							   "</div>");
        $(this.ContentDivSelector).html("");
        $(this.ContentDivSelector).append(mainContainer);

		this.FolderExplorerActionBar.Initialize(true);
    	this.FolderNavigator.Initialize(true);
    	this.FolderBrowser.Initialize(true);
    }
}
// ************************************************************
