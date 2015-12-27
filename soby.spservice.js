// ********************* HELPER METHODS *****************************
var soby = {};
// ******************************************************************

// ********************* HELPER METHODS *****************************
function soby_ServiceInterface(dataSourceBuilder) {
    this.DataSourceBuilder = dataSourceBuilder;
    this.Sort = function (propertyName, isAsc) { };
    this.Filter = function (propertyName, value, clearOtherFilters) { };
    this.GoToPage = function (pageIndex) { };
    this.CanNavigateToNextPage = function () { };
    this.CanNavigateToPreviousPage = function () { };
    this.PopulateItems = function () { }
    this.GetPropertyNames = function () { }
    this.ItemPopulated = null;
    this.ItemBeingPopulated = null;
    this.ErrorThrown = null;
}
// ******************************************************************

// ********************* HELPER METHODS *****************************
function soby_SharePointService(camlBuilder) {
    /* Caml related properties */
    this.NextPageString = "";
    this.NextPageStrings = new Array();
    this.NextPageStrings[0] = "";
    /* End - Caml related properties */

    this.FilterFieldName = "";
    this.FilterValue = "";
    this.SortFieldName = "";
    this.IsAscending = true;
    this.PageIndex = 0;
    this.StartIndex = 0;
    this.EndIndex = 0;
    this.DataSourceBuilder = camlBuilder;
    this.CamlBuilder = camlBuilder.Clone();
    this.Sort = function (propertyName, isAsc) {
        var viewField = this.CamlBuilder.GetViewFieldByPropertyName(propertyName);

        this.PageIndex = 0;
        this.NextPageString = "";
        this.NextPageStrings = new Array();
        this.NextPageStrings[0] = "";
        this.SortFieldName = viewField.FieldName;
        this.IsAscending = isAsc;

        this.PopulateItems();
    };
    this.Filter = function (propertyName, value, clearOtherFilters) {
        this.PageIndex = 0;
        this.NextPageString = "";
        this.NextPageStrings = new Array();
        this.NextPageStrings[0] = "";
        this.FilterFieldName = propertyName;
        this.FilterValue = value;

        this.PopulateItems();
    };
    this.GoToPage = function (pageIndex) {
        this.CamlBuilder.PageIndex = pageIndex;
        this.PageIndex = pageIndex;
        this.NextPageString = this.NextPageStrings[pageIndex];

        this.PopulateItems();
    };
    this.CanNavigateToNextPage = function () {
        if (this.CamlBuilder.PageIndex >= this.NextPageStrings.length - 1)
            return false;

        return true;
    };
    this.CanNavigateToPreviousPage = function () {
        if (this.CamlBuilder.PageIndex == 0)
            return false;

        return true;
    };
    this.PopulateItems = function () {
        if (this.ItemBeingPopulated != null)
            this.ItemBeingPopulated();

        this.CamlBuilder = this.DataSourceBuilder.Clone();
        if (this.SortFieldName != null && this.SortFieldName != "")
            this.CamlBuilder.AddOrderField(this.SortFieldName, this.IsAscending);
        if (this.FilterFieldName != null && this.FilterFieldName != "") {
            this.CamlBuilder.Filters.AddFilter(this.FilterFieldName, this.FilterValue, CamlFieldTypes.Lookup, CamlFilterTypes.Equal, true)
        }

        this.CamlBuilder.PageIndex = this.PageIndex;
        this.CamlBuilder.NextPageString = this.NextPageString;

        var service = this;

        soby_LogMessage(service.CamlBuilder.GetMainSoapEnvelope());
        soby_GetSPWSData(service.CamlBuilder.GetMainSoapEnvelope(),
		function (result) {
		    soby_LogMessage(result);
		    var items = service.CamlBuilder.ParseData(result);
		    soby_LogMessage(items);

		    if (service.CamlBuilder.NextPageString != null)
		        service.NextPageStrings[service.CamlBuilder.PageIndex + 1] = service.CamlBuilder.NextPageString;

		    var startIndex = (service.CamlBuilder.PageIndex * service.CamlBuilder.RowLimit) + 1;
		    var endIndex = startIndex + service.CamlBuilder.ItemCount - 1;
		    if (service.CamlBuilder.ItemCount == 0) {
		        startIndex = 0;
		        endIndex = 0;
		    }
		    service.StartIndex = startIndex;
		    service.EndIndex = endIndex;
		    service.ItemPopulated(items);
		},
		function (XMLHttpRequest, textStatus, errorThrown) {
		    var errorMessage = "An error occured on populating grid" + errorThrown;
		    if (service.ErrorThrown != null)
		        service.ErrorThrown(errorMessage);
		    soby_LogMessage(errorMessage);
		},
		function (XMLHttpRequest, textStatus, errorThrown) { }, true, service.CamlBuilder.WebUrl);
    }
    this.GetPropertyNames = function () {
        var propertyNames = new Array();
        for (var i = 0; i < this.CamlBuilder.ViewFields.length; i++) {
            propertyNames[propertyNames.length] = { PropertyName: this.CamlBuilder.ViewFields[i].PropertyName, FieldName: this.CamlBuilder.ViewFields[i].FieldName }
        }

        return propertyNames;
    }

}
// ******************************************************************

// ********************* HELPER METHODS *****************************
function soby_StaticDataService(items) {
    this.Items = items;
    this.FilterFieldName = "";
    this.FilterValue = "";
    this.SortFieldName = "";
    this.IsAscending = true;
    this.PageIndex = 0;
    this.StartIndex = 0;
    this.EndIndex = 0;
    this.Sort = function (propertyName, isAsc) {
        this.PopulateItems();
    };
    this.Filter = function (propertyName, value, clearOtherFilters) {
        this.PopulateItems();
    };
    this.GoToPage = function (pageIndex) {
        this.PopulateItems();
    };
    this.CanNavigateToNextPage = function () {
        return true;
    };
    this.CanNavigateToPreviousPage = function () {
        return true;
    };
    this.PopulateItems = function () {
        if (this.ItemBeingPopulated != null)
            this.ItemBeingPopulated();

        this.ItemPopulated(this.Items);
    }
    this.GetPropertyNames = function () {
        var propertyNames = new Array();
        return propertyNames;
    }

}
// ******************************************************************


// ********************* HELPER METHODS *****************************
var soby_guid = (function () {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
                   .toString(16)
                   .substring(1);
    }
    return function () {
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
               s4() + '-' + s4() + s4() + s4();
    };
})();

function soby_LogMessage(message) {
    try {
        console.log(message);
    } catch (err) { }
}

function soby_DateFromISO(d) {
    var xDate = d.split(" ")[0];
    var xTime = d.split(" ")[1];

    // split apart the hour, minute, & second
    var xTimeParts = xTime.split(":");
    var xHour = xTimeParts[0];
    var xMin = xTimeParts[1];
    var xSec = xTimeParts[2];

    // split apart the year, month, & day
    var xDateParts = xDate.split("-");
    var xYear = xDateParts[0];
    var xMonth = xDateParts[1] - 1;
    var xDay = xDateParts[2];

    var dDate = new Date(xYear, xMonth, xDay, xHour, xMin, xSec);
    return dDate;
    /*
    s = s.split(/\D/);
    return new Date(Date.UTC(s[0], --s[1] || '', s[2] || '', s[3] || '', s[4] || '', s[5] || '', s[6] || ''))
    */
}
function soby_GetFormatedDateString(date) {
    var dateOptions = { year: "numeric", month: "short", day: "numeric" };
    return (date != null ? date.toLocaleDateString("en-gb", dateOptions) : "")
}
// ********************* OLD SP POST HELPER *****************************
var soby_GetSPWSData = function (soapEnv, callback, errorcallback, completecallback, async, siteUrl, argsx) {
    var url = "/_vti_bin/Lists.asmx";
    if (siteUrl != null && siteUrl != "")
        url = siteUrl + "/_vti_bin/Lists.asmx";
    else
        url = "/_vti_bin/Lists.asmx";
    $.ajax({
        async: (async != null ? async : true),
        url: url,
        type: "POST",
        dataType: "xml",
        data: soapEnv,
        contentType: "text/xml; charset=\"utf-8\"",
        complete: function (data) {
            if (callback)
                callback(data, argsx);
        },
        error: function (XMLHttpRequest, textStatus, errorThrown) {
            if (errorcallback)
                errorcallback(XMLHttpRequest, textStatus, errorThrown);
        },
        success: function (XMLHttpRequest, textStatus, errorThrown) {
            if (completecallback)
                completecallback(XMLHttpRequest, textStatus, errorThrown, argsx);
        }
    });
};

// ************************************************************

// ********************* CAML BUILDER *****************************
var soby_FilterValueSeperator = "_SDX_";
var CamlFieldTypes = new Object(); CamlFieldTypes.Text = 0; CamlFieldTypes.Number = 1; CamlFieldTypes.MultiChoice = 2; CamlFieldTypes.Lookup = 3; CamlFieldTypes.Boolean = 4; CamlFieldTypes.Choice = 5; CamlFieldTypes.ModStat = 6; CamlFieldTypes.User = 7; CamlFieldTypes.TaxonomyFieldType = 8; CamlFieldTypes.DateTime = 9; CamlFieldTypes.Integer = 10; CamlFieldTypes.CurrentUserGroups = 11; CamlFieldTypes.DateTimeNowDifferenceAsMinute = 12;
var CamlFilterTypes = new Object(); CamlFilterTypes.Equal = 0; CamlFilterTypes.NotEqual = 1; CamlFilterTypes.Contains = 2; CamlFilterTypes.In = 3; CamlFilterTypes.Greater = 4; CamlFilterTypes.Lower = 5; CamlFilterTypes.GreaterEqual = 6; CamlFilterTypes.LowerEqual = 7; CamlFilterTypes.BeginsWith = 8; CamlFilterTypes.Membership = 9;

this.CamlFilters = function (isOr) {
    this.IsOr = isOr;
    this.Filters = new Array();
    this.AddFilter = function (fieldName, filterValue, fieldType, filterType, lookupID) {
        var camlFilter = new CamlFilter(fieldName, filterValue, fieldType, filterType, lookupID);
        this.Filters[this.Filters.length] = camlFilter;
    }

    this.AddFilterCollection = function (camlFilters) {
        this.Filters[this.Filters.length] = camlFilters;
    }

    this.ToCaml = function () {
        var camlString = "";
        var filterCompareString = this.IsOr == true ? "Or" : "And";
        for (var i = 0; i < this.Filters.length; i++) {
            if (this.Filters.length == 1) {
                camlString += this.Filters[i].ToCaml();
            }
            else if (i == 1) {
                camlString += "<" + filterCompareString + ">" + this.Filters[i - 1].ToCaml() + this.Filters[i].ToCaml() + "</" + filterCompareString + ">";
            }
            else if (i % 2 == 1) {
                camlString = "<" + filterCompareString + ">" + camlString + "<" + filterCompareString + ">" + this.Filters[i - 1].ToCaml() + this.Filters[i].ToCaml() + "</" + filterCompareString + "></" + filterCompareString + ">";
            }
            else if (i == this.Filters.length - 1) {
                camlString = "<" + filterCompareString + ">" + camlString + this.Filters[i].ToCaml() + "</" + filterCompareString + ">"
            }
        }
        return camlString;
    }

    this.Clone = function () {
        var camlFilters = new CamlFilters(this.IsOr);
        for (var i = 0; i < this.Filters.length; i++) {
            var filter = this.Filters[i];
            if (filter instanceof CamlFilter) {
                camlFilters.AddFilter(filter.FieldName, filter.FilterValue, filter.FieldType, filter.FilterType, filter.LookupID);
            }
            else {
                camlFilters.AddFilterCollection(filter.Clone());
            }
        }

        return camlFilters;
    }
}
this.CamlFilter = function (fieldName, filterValue, fieldType, filterType, lookupID) {
    this.FieldName = fieldName;
    this.FilterValue = filterValue;
    this.FieldType = fieldType;
    this.FilterType = filterType;
    this.LookupID = lookupID;
    this.ToCaml = function () {
        // <Eq><FieldRef Name='SessionNumber' /><Value Type='Number'>{1}</Value></Eq>
        var additionalFieldRefAttributes = "";
        var equvialentString = "";
        var valueString = "";
        if (this.LookupID == true) {
            additionalFieldRefAttributes = "LookupId=\"True\"";
        }

        var valueTypeString = "";
        switch (this.FieldType) {
            case CamlFieldTypes.Text:
                valueTypeString = "Text";
                break;
            case CamlFieldTypes.Number:
                valueTypeString = "Number";
                break;
            case CamlFieldTypes.Integer:
                valueTypeString = "Integer";
                break;
            case CamlFieldTypes.MultiChoice:
                valueTypeString = "MultiChoice";
                break;
            case CamlFieldTypes.Choice:
                valueTypeString = "Choice";
                break;
            case CamlFieldTypes.Boolean:
                valueTypeString = "Boolean";
                break;
            case CamlFieldTypes.ModStat:
                valueTypeString = "ModStat";
                break;
            case CamlFieldTypes.Lookup:
                valueTypeString = "Lookup";
                break;
            case CamlFieldTypes.CurrentUserGroups:
                valueTypeString = "CurrentUserGroups";
                break;
            case CamlFieldTypes.TaxonomyFieldType:
                valueTypeString = "TaxonomyFieldType";
                //return "<" + equvialentString + "><FieldRef Name=\"" + this.FieldName + "\" " + additionalFieldRefAttributes + " /><Values><Value Type=\"" + valueTypeString + "\">" + this.FilterValue + "</Value></Values></" + equvialentString + ">";
                //<In><FieldRef Name="Location" LookupId="TRUE"><Values><Value Type="Integer">13</Value><Value Type="Integer">3</Value><Value Type="Integer">9</Value></Values></In>
        }

        var value = this.FilterValue;
        if (value == "[*ME*]")
            valueString = "<Value Type='" + valueTypeString + "'><UserID /></Value>";
        else
            valueString = "<Value Type='" + valueTypeString + "'><![CDATA[" + this.FilterValue + "]]></Value>";
        switch (this.FilterType) {
            case CamlFilterTypes.Equal:
                equvialentString = "Eq";
                break;
            case CamlFilterTypes.NotEqual:
                equvialentString = "Neq";
                break;
            case CamlFilterTypes.Greater:
                equvialentString = "Gt";
                break;
            case CamlFilterTypes.Lower:
                equvialentString = "Lt";
                break;
            case CamlFilterTypes.GreaterEqual:
                equvialentString = "Geq";
                break;
            case CamlFilterTypes.LowerEqual:
                equvialentString = "Leq";
                break;
            case CamlFilterTypes.Contains:
                equvialentString = "Contains";
                break;
            case CamlFilterTypes.BeginsWith:
                equvialentString = "BeginsWith";
                break;
            case CamlFilterTypes.Membership:
                equvialentString = "Membership";
                valueString = "";
                break;
            case CamlFilterTypes.In:
                equvialentString = "In";
                var values = this.FilterValue.split(soby_FilterValueSeperator);
                valueString = "<Values>";
                for (var i = 0; i < values.length; i++) {
                    valueString += "<Value Type='" + valueTypeString + "'><![CDATA[" + values[i] + "]]></Value>";
                }
                valueString += "</Values>";
                break;
        }
        return "<" + equvialentString + (this.FilterType == CamlFilterTypes.Membership ? " Type='" + valueTypeString + "'" : "") + "><FieldRef Name='" + this.FieldName + "' " + additionalFieldRefAttributes + " />" + valueString + "</" + equvialentString + ">";
    }

}


function soby_CamlBuilder(listName, viewName, rowLimit, webUrl) {
    this.WebUrl = webUrl;
    this.ListName = listName;
    this.IsRecursive = false;
    this.ViewFields = new Array();
    this.ViewName = viewName;
    this.RowLimit = rowLimit;
    this.PageIndex = 0;
    this.NextPageString = "";
    this.OrderByFields = new Array();
    this.Filters = null;
    this.ItemCount = 0;

    this.Clone = function () {
        var camlBuilder = new soby_CamlBuilder(this.ListName, this.ViewName, this.RowLimit, this.WebUrl);
        camlBuilder.IsRecursive = this.IsRecursive;
        for (var i = 0; i < this.ViewFields.length; i++) {
            var viewField = this.ViewFields[i];
            camlBuilder.AddViewField(viewField.FieldName, viewField.PropertyName, viewField.FieldType, viewField.DisplayName, viewField.IsVisible, viewField.DisplayFunction);
        }

        for (var i = 0; i < this.OrderByFields.length; i++) {
            var orderByField = this.OrderByFields[i];
            camlBuilder.AddOrderField(orderByField.FieldName, orderByField.IsAsc);
        }

        camlBuilder.Filters = this.Filters.Clone();

        return camlBuilder;
    }

    this.GetViewField = function (fieldName) {
        for (var i = 0; i < this.ViewFields.length; i++) {
            if (this.ViewFields[i].FieldName == fieldName)
                return this.ViewFields[i];
        }

        return null;
    }

    this.GetViewFieldByPropertyName = function (propertyName) {
        for (var i = 0; i < this.ViewFields.length; i++) {
            if (this.ViewFields[i].PropertyName == propertyName)
                return this.ViewFields[i];
        }

        return null;
    }

    this.AddViewField = function (fieldName, propertyName, fieldType) {
        var viewField = new Object();
        viewField.FieldName = fieldName;
        viewField.PropertyName = propertyName;
        viewField.FieldType = fieldType;
        this.ViewFields[this.ViewFields.length] = viewField;
    }

    this.AddOrderField = function (fieldName, isAsc) {
        var orderField = new Object();
        orderField.FieldName = fieldName;
        orderField.IsAsc = isAsc;
        this.OrderByFields[this.OrderByFields.length] = orderField;
    }
    this.GetPagingSoapEnvelope = function () {
        if (this.NextPageString != null && this.NextPageString != "") {
            //var  "&PageFirstRow=" + pageFirstRow 
            //var pageFirstRow = "PageFirstRow=" + (this.PageIndex * this.RowLimit + 1);
            //return "<Paging ListItemCollectionPositionNext=\"Paged=TRUE&amp;p_ID=" + this.NextPageString + "\" />";
            return "<Paging ListItemCollectionPositionNext=\"" + this.NextPageString.replace(/&/gi, "&amp;") + "\" />";
        }
        else {
            return "";
        }
    }
    this.GetViewFieldsSoapEnvelope = function () {
        var soapEnvelope = "";
        for (var i = 0; i < this.ViewFields.length; i++) {
            soapEnvelope += "<FieldRef Name='" + this.ViewFields[i].FieldName + "' />";
        }

        if (soapEnvelope != "")
            soapEnvelope = "<ViewFields xmlns=\"\">" + soapEnvelope + "</ViewFields>";
        return soapEnvelope;
    }
    this.GetOrderByFieldsSoapEnvelope = function () {
        var soapEnvelope = "";
        for (var i = 0; i < this.OrderByFields.length; i++) {
            soapEnvelope += "<FieldRef Name='" + this.OrderByFields[i].FieldName + "'  Ascending='" + (this.OrderByFields[i].IsAsc == true ? "TRUE" : "FALSE") + "' />";
        }

        if (soapEnvelope != "")
            soapEnvelope = "<OrderBy>" + soapEnvelope + "</OrderBy>";
        return soapEnvelope;
    }
    this.GetWhereSoapEnvelope = function () {
        var soapEnvelope = "";
        if (this.Filters != null) {
            soapEnvelope = "<Where>" + this.Filters.ToCaml() + "</Where>";
        }
        return soapEnvelope;
    }
    this.GetMainSoapEnvelope = function () {
        var soapEnv = "<soap:Envelope xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance'" +
					    " xmlns:xsd='http://www.w3.org/2001/XMLSchema' \
					      xmlns:soap='http://schemas.xmlsoap.org/soap/envelope/'> \
					      <soap:Body> \
					        <GetListItems xmlns='http://schemas.microsoft.com/sharepoint/soap/'> \
					          <listName>" + this.ListName + "</listName> \
					          <viewName>" + this.ViewName + "</viewName> \
					          <query><Query>" + this.GetWhereSoapEnvelope() + this.GetOrderByFieldsSoapEnvelope() + "</Query></query> \
					          <viewFields>" + this.GetViewFieldsSoapEnvelope() + "</viewFields> \
					          <rowLimit>" + this.RowLimit + "</rowLimit> \
					          <queryOptions><QueryOptions xmlns=''><IncludeMandatoryColumns>FALSE</IncludeMandatoryColumns>" + (this.IsRecursive==true?"<ViewAttributes Scope='RecursiveAll'/>":"") + this.GetPagingSoapEnvelope() + "</QueryOptions></queryOptions> \
					        </GetListItems> \
					      </soap:Body> \
					    </soap:Envelope>";
        return soapEnv;
    }
    this.ParseData = function (result) {
        var items = new Array();
        var viewFields = this.ViewFields;
        var xmlData = $(result.responseText);
        this.ItemCount = Math.round(xmlData.find("rs\\:data, data").attr("ItemCount"));
        var listItemNext = xmlData.find("rs\\:data, data").attr("ListItemCollectionPositionNext");
        if (listItemNext != "" && listItemNext != null) {
            this.NextPageString = listItemNext;//.substring(listItemNext.lastIndexOf('=') + 1);
        }
        else {
            this.NextPageString = null;
        }
        xmlData.find("z\\:row, row").each(function () {
            var item = new Object();
            for (var i = 0; i < viewFields.length; i++) {
                var value = $(this).attr("ows_" + viewFields[i].FieldName);
                switch (viewFields[i].FieldType) {
                    case CamlFieldTypes.Lookup:
                        var valueArray = new Array();
                        if (value != "" && value != null) {
                            var values = value.split(";#");
                            for (var x = 0; x < values.length; x = x + 2) {
                                var valueItem = new Object();
                                valueItem.ID = values[x];
                                valueItem.DisplayName = values[x + 1];
                                valueArray[valueArray.length] = valueItem;
                            }
                        }
                        value = valueArray;
                        break;
                    case CamlFieldTypes.MultiChoice:
                        var valueArray = new Array();
                        if (value != "" && value != null) {
                            var values = value.split(";#");
                            for (var x = 0; x < values.length; x++) {
                                if (x == 0 || x == values.length - 1)
                                    continue;
                                valueArray[valueArray.length] = values[x];
                            }
                        }
                        value = valueArray;
                        break;
                    case CamlFieldTypes.Boolean:
                        if (value == "1")
                            value = true;
                        else
                            value = false;
                        break;
                    case CamlFieldTypes.DateTime:
                        if (value != "" && value != null) {
                            value = soby_DateFromISO(value);
                        }
                        break;
                    default:
                        if (value == null)
                            value = "";

                }

                item[viewFields[i].PropertyName] = value;
            }

            if (viewFields.length == 0) {
                $.each(this.attributes, function (i, attrib) {
                    var name = attrib.name.substring(4);
                    var value = attrib.value;
                    item[name] = value;
                });
            }

            items[items.length] = item;
        });
        return items;
    }
}


// ************************************************************

// ************************************************************
soby.SPLibrary = {};
soby.SPLibrary.Lists = {};

soby.SPLibrary.Lists.AddWikiPage = function(siteUrl, listName, listRelPageUrl, wikiContent, callBackFunction, _arguments, isAsync) {
    if(isAsync == null || isAsync =="")
        isAsync = true;

    var soapEnv = "<soap:Envelope xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xmlns:xsd='http://www.w3.org/2001/XMLSchema' xmlns:soap='http://schemas.xmlsoap.org/soap/envelope/'> \
					<soap:Body> \
					    <AddWikiPage xmlns=\"http://schemas.microsoft.com/sharepoint/soap/\"> \
						  <strListName>" + listName + "</strListName> \
						  <listRelPageUrl>" + listRelPageUrl + "</listRelPageUrl> \
						  <wikiContent>" + wikiContent + "</wikiContent> \
						</AddWikiPage> \
					</soap:Body> \
				</soap:Envelope>";

    $.ajax({
        async: isAsync,
        url: siteUrl + "/_vti_bin/Lists.asmx",
        beforeSend: function (xhr) { xhr.setRequestHeader("SOAPAction", "http://schemas.microsoft.com/sharepoint/soap/AddWikiPage"); },
        type: "POST",
        dataType: "xml",
        data: soapEnv,
        complete: function processResult(xData, status) {
            soby_LogMessage(xData.responseText)
            if (callBackFunction != null)
                callBackFunction(_arguments);
        },
        error: function (XMLHttpRequest, textStatus, errorThrown) { soby_LogMessage(XMLHttpRequest); soby_LogMessage(textStatus); soby_LogMessage(errorThrown); },
        contentType: "text/xml; charset=\"utf-8\""
    });
}

soby.SPLibrary.Lists.GetListProperties = function(webUrl, listName, callbackFunction, isAsync) {
    if(isAsync == null || isAsync =="")
        isAsync = true;
    var soapEnv = "<soap:Envelope xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xmlns:xsd='http://www.w3.org/2001/XMLSchema' xmlns:soap='http://schemas.xmlsoap.org/soap/envelope/'> \
					<soap:Body> \
					 <GetList xmlns='http://schemas.microsoft.com/sharepoint/soap/'> \
					 	<listName>" + listName + "</listName> \
				 	 </GetList> \
				 	</soap:Body> \
				   </soap:Envelope>";

    soby_GetSPWSData(soapEnv,
    function (result) {
        var xmlData = $(result.responseText);
        var list = null;
        var listResult = xmlData.find("List");
        if (listResult.length > 0) {
            list = new Object();
            list.ID = $(listResult[0]).attr("id");
            callbackFunction(list);
        }
        else {
            callbackFunction(null);
        }
    },
    function (XMLHttpRequest, textStatus, errorThrown) {
        soby_LogMessage(errorThrown);
    },
    function (XMLHttpRequest, textStatus, errorThrown) { }, false, webUrl);

}

soby.SPLibrary.Lists.ApproveListItem = function (siteUrl, listName, id, callbackFunction) {
    var batch =
           "<Batch OnError=\"Continue\"> \
            <Method ID=\"1\" Cmd=\"Moderate\"> \
                <Field Name=\"ID\">" + id + "</Field> \
                <Field Name=\"_ModerationStatus\">0</Field> \
                                                 </Method> \
        </Batch>";
    var soapEnv =
        "<?xml version=\"1.0\" encoding=\"utf-8\"?> \
        <soap:Envelope xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance/\" \
            xmlns:xsd=\"http://www.w3.org/2001/XMLSchema/\" \
            xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\"> \
          <soap:Body> \
            <UpdateListItems xmlns=\"http://schemas.microsoft.com/sharepoint/soap/\"> \
              <listName>" + listName + "</listName> \
              <updates> \
                " + batch + "</updates> \
            </UpdateListItems> \
          </soap:Body> \
        </soap:Envelope>";


    $.ajax({
        async: false,
        url: siteUrl + "/_vti_bin/lists.asmx",
        beforeSend: function (xhr) {
            xhr.setRequestHeader("SOAPAction",
            "http://schemas.microsoft.com/sharepoint/soap/UpdateListItems");
        },
        type: "POST",
        dataType: "xml",
        data: soapEnv,
        complete: function (data) { if (callbackFunction != null) callbackFunction(); },
        success: function (XMLHttpRequest, textStatus, errorThrown) { soby_LogMessage(XMLHttpRequest) },
        error: function (XMLHttpRequest, textStatus, errorThrown) { soby_LogMessage(XMLHttpRequest) },
        contentType: "text/xml; charset=utf-8"
    });
}

soby.SPLibrary.Lists.UpdateList = function(siteUrl, listName, listProperties, callBackFunction, _arguments, isAsync) {
    if(isAsync == null || isAsync =="")
        isAsync = true;

    var listPropertiesXml = "<List ";
    for(var i=0;i<listProperties.length;i++){
        listPropertiesXml += listProperties[i].Key + "=\"" + listProperties[i].Value + "\" ";
    }
    listPropertiesXml += "></List>";
    var soapEnv = "<soap:Envelope xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xmlns:xsd='http://www.w3.org/2001/XMLSchema' xmlns:soap='http://schemas.xmlsoap.org/soap/envelope/'> \
					<soap:Body> \
					    <UpdateList xmlns=\"http://schemas.microsoft.com/sharepoint/soap/\"> \
						  <listName>" + listName + "</listName> \
						  <listProperties>" + listPropertiesXml + "</listProperties> \
						</UpdateList> \
					</soap:Body> \
				</soap:Envelope>";

    $.ajax({
        async: isAsync,
        url: siteUrl + "/_vti_bin/Lists.asmx",
        beforeSend: function (xhr) { xhr.setRequestHeader("SOAPAction", "http://schemas.microsoft.com/sharepoint/soap/UpdateList"); },
        type: "POST",
        dataType: "xml",
        data: soapEnv,
        complete: function processResult(xData, status) {
            soby_LogMessage(xData.responseText)
            if (callBackFunction != null)
                callBackFunction(_arguments);
        },
        error: function (XMLHttpRequest, textStatus, errorThrown) { soby_LogMessage(XMLHttpRequest); soby_LogMessage(textStatus); soby_LogMessage(errorThrown); },
        contentType: "text/xml; charset=\"utf-8\""
    });
}

/*
function soby_UpdateList(siteUrl, listName, listProperties, callBackFunction, _arguments, isAsync) {
	if(isAsync == null)
		isAsync = true;
    var listPropertiesXml = "<List ";
    for(var i=0;i<listProperties.length;i++){
        listPropertiesXml += listProperties[i].Key + "=\"" + listProperties[i].Value + "\" ";
    }
    listPropertiesXml += "></List>";
    var soapEnv = "<soap:Envelope xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xmlns:xsd='http://www.w3.org/2001/XMLSchema' xmlns:soap='http://schemas.xmlsoap.org/soap/envelope/'> \
					<soap:Body> \
					    <UpdateList xmlns=\"http://schemas.microsoft.com/sharepoint/soap/\"> \
						  <listName>" + listName + "</listName> \
						  <listProperties>" + listPropertiesXml + "</listProperties> \
						</UpdateList> \
					</soap:Body> \
				</soap:Envelope>";

    $.ajax({
        async: isAsync,
        url: siteUrl + "/_vti_bin/Lists.asmx",
        beforeSend: function (xhr) { xhr.setRequestHeader("SOAPAction", "http://schemas.microsoft.com/sharepoint/soap/UpdateList"); },
        type: "POST",
        dataType: "xml",
        data: soapEnv,
        complete: function processResult(xData, status) {
            soby_LogMessage(xData.responseText)
            if (callBackFunction != null)
                callBackFunction(_arguments);
        },
        error: function (XMLHttpRequest, textStatus, errorThrown) { soby_LogMessage(XMLHttpRequest); soby_LogMessage(textStatus); soby_LogMessage(errorThrown); },
        contentType: "text/xml; charset=\"utf-8\""
    });
}
*/

soby.SPLibrary.Lists.UpdateItem = function(webUrl, listName, itemID, dataFields, successCallbackFunction, errorCallbackFunction, isAsync, argumentsx) {
    var batch = "<Batch OnError=\"Continue\">";
    if (itemID != null && itemID != "")
        batch += "<Method ID=\"" + itemID + "\" Cmd=\"Update\">";
    else
        batch += "<Method ID=\"1\" Cmd=\"New\">";

    if (itemID != null && itemID != "")
        dataFields[dataFields.length] = { FieldName: "ID", Value: itemID };

    for (var i = 0; i < dataFields.length; i++) {
        batch += "<Field Name=\"" + dataFields[i].FieldName + "\"><![CDATA[" + dataFields[i].Value + "]]></Field>";
    }

    batch += "</Method></Batch>";

    var soapEnv =
        "<?xml version=\"1.0\" encoding=\"utf-8\"?> \
        <soap:Envelope xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance/\" \
            xmlns:xsd=\"http://www.w3.org/2001/XMLSchema/\" \
            xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\"> \
          <soap:Body> \
            <UpdateListItems xmlns=\"http://schemas.microsoft.com/sharepoint/soap/\"> \
              <listName>" + listName + "</listName> \
              <updates> \
                " + batch + "</updates> \
            </UpdateListItems> \
          </soap:Body> \
        </soap:Envelope>";

    soby_LogMessage(soapEnv);
    if(isAsync == null || isAsync =="")
        isAsync = true;
    $.ajax({
        async: isAsync,
        url: webUrl + "/_vti_bin/lists.asmx",
        beforeSend: function (xhr) {
            xhr.setRequestHeader("SOAPAction",
            "http://schemas.microsoft.com/sharepoint/soap/UpdateListItems");
        },
        type: "POST",
        dataType: "xml",
        data: soapEnv,
        complete: function (data) {
        },
        error: function (XMLHttpRequest, textStatus, errorThrown) {
            soby_LogMessage("An error occured on UpdateItem");
            soby_LogMessage(XMLHttpRequest);
            soby_LogMessage(textStatus);
            soby_LogMessage(errorThrown);
			if(errorCallbackFunction != null)
                errorCallbackFunction(argumentsx);
        },
        success: function (data) {
            var xmlData = $(data);
            var itemId = xmlData.find("z\\:row, row").attr("ows_ID");
            if (successCallbackFunction != null)
                successCallbackFunction(itemId, argumentsx)
        },
        contentType: "text/xml; charset=utf-8"
    });
}

soby.SPLibrary.Lists.UploadFile = function(siteUrl, sourceFileUrl, destinationFileUrl, fieldValues, callBackFunction, _arguments, isAsync) {
	var fieldValueString= "";
	for(var i=0;i<fieldValues.length;i++)
	{
        fieldValueString += "<FieldInformation Type='" + fieldValues[i].Type + "' Value='" + fieldValues[i].Value + "' ";
		if(fieldValues[i].InternalName != null)
            fieldValueString += " InternalName='" + fieldValues[i].InternalName + "'";
        else
            fieldValueString += " DisplayName='" + fieldValues[i].DisplayName + "'";
        fieldValueString += " />";
    }
    var soapEnv =
    "<soap:Envelope xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xmlns:xsd='http://www.w3.org/2001/XMLSchema' xmlns:soap='http://schemas.xmlsoap.org/soap/envelope/'> \
        <soap:Body>\
            <CopyIntoItemsLocal xmlns='http://schemas.microsoft.com/sharepoint/soap/'>\
                <SourceUrl><![CDATA[" + sourceFileUrl.trim() + "]]></SourceUrl>\
                    <DestinationUrls>\
                        <string><![CDATA[" + destinationFileUrl.trim() + "]]></string>\
                    </DestinationUrls>\
                    <Fields>\
                    " + fieldValueString + " \
                    </Fields>\
            </CopyIntoItemsLocal>\
        </soap:Body>\
    </soap:Envelope>";
    soby_LogMessage(soapEnv);

	if(isAsync == null)
        isAsync = true;

    $.ajax({
        async: isAsync,
        url: siteUrl + "/_vti_bin/copy.asmx",
        beforeSend: function (xhr) { xhr.setRequestHeader("SOAPAction", "http://schemas.microsoft.com/sharepoint/soap/CopyIntoItemsLocal"); },
        type: "POST",
        dataType: "xml",
        data: soapEnv,
        complete: function processResult(xData, status) {
            soby_LogMessage("Upload result;");
            soby_LogMessage(xData);
            soby_LogMessage(status);

            if (callBackFunction != null)
                callBackFunction(_arguments);
        },
        contentType: "text/xml; charset=\"utf-8\""
    });
}

soby.SPLibrary.Lists.GetLists = function (siteUrl, callbackFunction) {
    var soapEnv =
        "<?xml version=\"1.0\" encoding=\"utf-8\"?> \
        <soap:Envelope xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance/\" \
            xmlns:xsd=\"http://www.w3.org/2001/XMLSchema/\" \
            xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\"> \
          <soap:Body> \
		     <GetListCollection xmlns=\"http://schemas.microsoft.com/sharepoint/soap/\" /> \
          </soap:Body> \
    </soap:Envelope>";


    $.ajax({
        async: false,
        url: siteUrl + "/_vti_bin/lists.asmx",
        beforeSend: function (xhr) {
            xhr.setRequestHeader("SOAPAction",
            "http://schemas.microsoft.com/sharepoint/soap/GetListCollection");
        },
        type: "POST",
        dataType: "xml",
        data: soapEnv,
        complete: function (data) {
            var lists = new Array();
            var xmlData = $(data.responseText);
            var listsXml = xmlData.find("List");
            for (var i = 0; i < listsXml.length; i++) {
                var listXml = $(listsXml[i]);
                var list = {};
                list.ID = listXml.attr("ID");
                list.Title = listXml.attr("Title");
                list.Fields = soby.SPLibrary.Lists.GetListFields(siteUrl, list.Title);
                lists[lists.length] = list;
            }

            if (callbackFunction != null)
                callbackFunction(lists);
        },
        success: function (XMLHttpRequest, textStatus, errorThrown) { UNFCCC_LogMessage(XMLHttpRequest) },
        error: function (XMLHttpRequest, textStatus, errorThrown) { UNFCCC_LogMessage(XMLHttpRequest) },
        contentType: "text/xml; charset=utf-8"
    });
}

soby.SPLibrary.Lists.GetListFields = function (siteUrl, listName) {
    var soapEnv =
        "<?xml version=\"1.0\" encoding=\"utf-8\"?> \
        <soap:Envelope xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance/\" \
            xmlns:xsd=\"http://www.w3.org/2001/XMLSchema/\" \
            xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\"> \
          <soap:Body> \
		    <GetList xmlns=\"http://schemas.microsoft.com/sharepoint/soap/\"> \
		      <listName>" + listName + "</listName> \
		    </GetList> \
	      </soap:Body> \
	    </soap:Envelope>";

    var fields = new Array();
    $.ajax({
        async: false,
        url: siteUrl + "/_vti_bin/lists.asmx",
        beforeSend: function (xhr) {
            xhr.setRequestHeader("SOAPAction",
            "http://schemas.microsoft.com/sharepoint/soap/GetList");
        },
        type: "POST",
        dataType: "xml",
        data: soapEnv,
        complete: function (data) {
            var xmlData = $(data.responseText);
            var fieldsXml = xmlData.find("Field");
            for (var i = 0; i < fieldsXml.length; i++) {
                var fieldXml = $(fieldsXml[i]);
                if (fieldXml.attr("frombasetype") == "TRUE" && fieldXml.attr("name") != "Title")
                    continue;
                if (fieldXml.attr("id") == null || fieldXml.attr("id") == "")
                    continue;

                var required = false;
                if (fieldXml.attr("required") == "TRUE")
                    required = true;

                var hidden = false;
                if (fieldXml.attr("hidden") == "TRUE")
                    hidden = true;

                var field = {};
                field.ID = fieldXml.attr("id");
                field.InternalName = fieldXml.attr("name");
                field.DisplayName = fieldXml.attr("displayname");
                field.Type = fieldXml.attr("type");
                field.Required = required;
                field.Hidden = hidden;
                fields[fields.length] = field;
            }
        },
        success: function (XMLHttpRequest, textStatus, errorThrown) { UNFCCC_LogMessage(XMLHttpRequest) },
        error: function (XMLHttpRequest, textStatus, errorThrown) { UNFCCC_LogMessage(XMLHttpRequest) },
        contentType: "text/xml; charset=utf-8"
    });

    return fields;
}

soby.SPLibrary.Lists.CreateList = function (siteUrl, listName, templateID, passedArguments, successCallbackFunction, isAsync) {
    if (isAsync == null)
        isAsync = true;
    var soapEnv =
        "<?xml version=\"1.0\" encoding=\"utf-8\"?> \
        <soap:Envelope xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance/\" \
            xmlns:xsd=\"http://www.w3.org/2001/XMLSchema/\" \
            xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\"> \
          <soap:Body> \
		    <AddList xmlns=\"http://schemas.microsoft.com/sharepoint/soap/\"> \
		      <listName>" + listName + "</listName> \
		      <description>" + listName + "</description> \
		      <templateID>" + templateID + "</templateID> \
		    </AddList> \
	      </soap:Body> \
	    </soap:Envelope>";

    $.ajax({
        async: isAsync,
        url: siteUrl + "/_vti_bin/lists.asmx",
        beforeSend: function (xhr) {
            xhr.setRequestHeader("SOAPAction",
            "http://schemas.microsoft.com/sharepoint/soap/AddList");
        },
        type: "POST",
        dataType: "xml",
        data: soapEnv,
        complete: function (data) {
            var xmlData = $(data.responseText);
            if (successCallbackFunction != null)
                successCallbackFunction([listName], passedArguments);
        },
        success: function (XMLHttpRequest, textStatus, errorThrown) { UNFCCC_LogMessage(XMLHttpRequest) },
        error: function (XMLHttpRequest, textStatus, errorThrown) { UNFCCC_LogMessage(XMLHttpRequest) },
        contentType: "text/xml; charset=utf-8"
    });
}

soby.SPLibrary.Lists.CheckOutFile = function (siteUrl, fileUrl, callbackFunction) {
    var soapEnv =
        "<?xml version=\"1.0\" encoding=\"utf-8\"?> \
        <soap:Envelope xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance/\" \
            xmlns:xsd=\"http://www.w3.org/2001/XMLSchema/\" \
            xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\"> \
          <soap:Body> \
            <CheckOutFile xmlns=\"http://schemas.microsoft.com/sharepoint/soap/\"> \
              <pageUrl>" + fileUrl + "</pageUrl> \
            </CheckOutFile> \
          </soap:Body> \
        </soap:Envelope>";


    $.ajax({
        async: false,
        url: siteUrl + "/_vti_bin/lists.asmx",
        beforeSend: function (xhr) {
            xhr.setRequestHeader("SOAPAction",
            "http://schemas.microsoft.com/sharepoint/soap/CheckOutFile");
        },
        type: "POST",
        dataType: "xml",
        data: soapEnv,
        complete: function (data) {
            var xmlData = $(data.responseText);
            var result = xmlData.find("CheckOutFileResult").text();
            var success = false;
            if (result == "true")
                success = true;

            if (callbackFunction != null) callbackFunction(success);
        },
        success: function (XMLHttpRequest, textStatus, errorThrown) { UNFCCC_LogMessage(XMLHttpRequest) },
        error: function (XMLHttpRequest, textStatus, errorThrown) { UNFCCC_LogMessage(XMLHttpRequest) },
        contentType: "text/xml; charset=utf-8"
    });
}

soby.SPLibrary.Lists.CheckInFile = function (siteUrl, fileUrl, comment, checkinType, callbackFunction) {
    var soapEnv =
        "<?xml version=\"1.0\" encoding=\"utf-8\"?> \
        <soap:Envelope xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance/\" \
            xmlns:xsd=\"http://www.w3.org/2001/XMLSchema/\" \
            xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\"> \
          <soap:Body> \
            <CheckInFile xmlns=\"http://schemas.microsoft.com/sharepoint/soap/\"> \
              <pageUrl>" + fileUrl + "</pageUrl> \
              <comment>" + comment + "</comment> \
              <CheckinType>" + checkinType + "</CheckinType> \
            </CheckInFile> \
          </soap:Body> \
        </soap:Envelope>";


    $.ajax({
        async: false,
        url: siteUrl + "/_vti_bin/lists.asmx",
        beforeSend: function (xhr) {
            xhr.setRequestHeader("SOAPAction",
            "http://schemas.microsoft.com/sharepoint/soap/CheckInFile");
        },
        type: "POST",
        dataType: "xml",
        data: soapEnv,
        complete: function (data) { if (callbackFunction != null) callbackFunction(); },
        success: function (XMLHttpRequest, textStatus, errorThrown) { UNFCCC_LogMessage(XMLHttpRequest) },
        error: function (XMLHttpRequest, textStatus, errorThrown) { UNFCCC_LogMessage(XMLHttpRequest) },
        contentType: "text/xml; charset=utf-8"
    });
}

soby.SPLibrary.Lists.UpdateFieldsToList = function (addAction, siteUrl, listTemplate, fieldTemplates, successCallBack, errorCallBack, isAsync) {
    if (isAsync == null)
        isAsync = true;
    console.log("isAsync:")
    console.log(isAsync)
    var fieldsXml = "";
    for (var i = 0; i < fieldTemplates.length; i++) {
        var fieldXml = "<Field DisplayName='" + (addAction == true ? fieldTemplates[i].InternalName : fieldTemplates[i].DisplayName) + "' Name='" + fieldTemplates[i].InternalName + "' ";
        if (fieldTemplates[i].Type == "User" && fieldTemplates[i].Mult == true) {
            fieldXml += " Type='UserMulti'";
        }
        else {
            fieldXml += " Type='" + fieldTemplates[i].Type + "'";
        }

        if (fieldTemplates[i].Hidden == true)
            fieldXml += " Hidden='TRUE'";
        if (fieldTemplates[i].Required == true)
            fieldXml += " Required='TRUE'";

        if (fieldTemplates[i].Type == "Lookup") {
            var listId = "";
            soby.SPLibrary.Lists.GetListProperties(siteUrl, fieldTemplates[i].LookupListName, function (properties) {
                listId = properties.ID;
            }, false);
            fieldXml += " ShowField='Title' List='" + listId + "' />"
        }
        else if (fieldTemplates[i].Type == "Choice" || fieldTemplates[i].Type == "MultiChoice") {

            fieldXml += "><CHOICES>";
            for (var n = 0; n < fieldTemplates[i].Choices.length; n++) {
                fieldXml += "<CHOICE>" + fieldTemplates[i].Choices[n] + "</CHOICE>";
            }
            fieldXml += "</CHOICES>"
            if (fieldTemplates[i].DefaultValue != null && fieldTemplates[i].DefaultValue != "")
                fieldXml += "<Default>" + fieldTemplates[i].DefaultValue + "</Default>";
            fieldXml += "</Field>";
        }
        else if (fieldTemplates[i].Type == "URL") {
            fieldXml += " Format='Hyperlink' />";
        }
        else if (fieldTemplates[i].Type == "Note") {
            fieldXml += " NumLines='6' AppendOnly='FALSE' RichText='FALSE' />";
        }
        else if (fieldTemplates[i].Type == "User") {
            if (fieldTemplates[i].ShowField != null) {
                fieldXml += " ShowField='" + fieldTemplates[i].ShowField + "' "
            }
            if (fieldTemplates[i].Mult == true) {
                fieldXml += " UserSelectionMode='PeopleOnly' UserSelectionScope='0' Mult='TRUE' />"
            }
            else {
                fieldXml += " UserSelectionMode='PeopleOnly' UserSelectionScope='0' Mult='TRUE' />"
            }
        }
        else {
            fieldXml += " />";
        }

        fieldsXml += "<Method ID=\"" + i + "\">" + fieldXml + "</Method>";
    }

    fieldsXml = "<Fields>" + fieldsXml + "</Fields>";

    var newFieldsString = "";
    var updateFieldsString = "";
    if (addAction == true)
        newFieldsString = "<newFields>" + fieldsXml + "</newFields>";
    else
        updateFieldsString = "<updateFields>" + fieldsXml + "</updateFields>";

    var soapEnv = "<soap:Envelope xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xmlns:xsd='http://www.w3.org/2001/XMLSchema' xmlns:soap='http://schemas.xmlsoap.org/soap/envelope/'> \
					<soap:Body> \
						 <UpdateList xmlns=\"http://schemas.microsoft.com/sharepoint/soap/\"> \
							  <listName>" + listTemplate.Title + "</listName> \
							  <listProperties></listProperties> \
							  " + newFieldsString + " \
							  " + updateFieldsString + " \
						</UpdateList> \
				 	</soap:Body> \
				   </soap:Envelope>";
    $.ajax({
        async: isAsync,
        url: siteUrl + "/_vti_bin/lists.asmx",
        beforeSend: function (xhr) {
            xhr.setRequestHeader("SOAPAction",
            "http://schemas.microsoft.com/sharepoint/soap/UpdateList");
        },
        type: "POST",
        dataType: "xml",
        data: soapEnv,
        complete: function (data) {
            var xmlData = $(data.responseText);
        },
        success: function (XMLHttpRequest, textStatus, errorThrown) { },
        error: function (XMLHttpRequest, textStatus, errorThrown) { soby_LogMessage(XMLHttpRequest) },
        contentType: "text/xml; charset=utf-8"
    });
    if (successCallBack != null)
        successCallBack();
}



soby.SPLibrary.UserGroup = {};
soby.SPLibrary.GetListItemAttachments = function (listName, listItemId, callbackFunction, webUrl) {
    var soapEnv = "<soap:Envelope xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xmlns:xsd='http://www.w3.org/2001/XMLSchema' xmlns:soap='http://schemas.xmlsoap.org/soap/envelope/'> \
					<soap:Body> \
					 <GetAttachmentCollection xmlns='http://schemas.microsoft.com/sharepoint/soap/'> \
					 	<listName>" + listName + "</listName> \
					 	<listItemID>" + listItemId + "</listItemID> \
				 	 </GetAttachmentCollection> \
				 	</soap:Body> \
				   </soap:Envelope>";

    soby_GetSPWSData(soapEnv,
    function (result) {
        var xmlData = $(result.responseText);
        var list = null;
        var attachmentsArray = xmlData.find("Attachment");
        var attachments = new Array();
        for (var i = 0; i < attachmentsArray.length; i++) {
            attachments[attachments.length] = $(attachmentsArray[i]).text();
        }

        callbackFunction(listItemId, attachments);
    },
    function (XMLHttpRequest, textStatus, errorThrown) {
        soby_LogMessage(errorThrown);
    },
    function (XMLHttpRequest, textStatus, errorThrown) { }, true, webUrl);
}

soby.SPLibrary.UserGroup.GetGroupUsers = function (siteUrl, groupName, callbackFunction, args, isAsync) {
    if (isAsync == null)
        isAsync = true;
    var soapEnv = "<soap:Envelope xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xmlns:xsd='http://www.w3.org/2001/XMLSchema' xmlns:soap='http://schemas.xmlsoap.org/soap/envelope/'> \
					<soap:Body> \
					    <GetUserCollectionFromGroup xmlns='http://schemas.microsoft.com/sharepoint/soap/directory/'> \
					      <groupName>" + groupName + "</groupName> \
 					   </GetUserCollectionFromGroup> \
				 	</soap:Body> \
				   </soap:Envelope>";
    $.ajax({
        async: isAsync,
        url: siteUrl + "/_vti_bin/usergroup.asmx",
        beforeSend: function (xhr) {
            xhr.setRequestHeader("SOAPAction",
            "http://schemas.microsoft.com/sharepoint/soap/directory/GetUserCollectionFromGroup");
        },
        type: "POST",
        dataType: "xml",
        data: soapEnv,
        complete: function (data) {
            var _users = new Array();
            var xmlData = $(data.responseText);
            var users = xmlData.find("User");
            for (var i = 0; i < users.length; i++) {
                var _userId = $(users[i]).attr("id");
                var name = $(users[i]).attr("name");
                var loginname = $(users[i]).attr("loginname");
                var email = $(users[i]).attr("email");
                _users[_users.length] = { ID: _userId, Name: name, LoginName: loginname, Email: email }
            }

            if (callbackFunction != null)
                callbackFunction(_users, args)

        },
        success: function (XMLHttpRequest, textStatus, errorThrown) { },
        error: function (XMLHttpRequest, textStatus, errorThrown) { UNFCCC_LogMessage(XMLHttpRequest) },
        contentType: "text/xml; charset=utf-8"
    });
}

soby.SPLibrary.UserGroup.CheckGroupContainsUser = function (siteUrl, groupName, userId, callbackFunction) {
    //SBI Document Unit Members
    var soapEnv = "<soap:Envelope xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xmlns:xsd='http://www.w3.org/2001/XMLSchema' xmlns:soap='http://schemas.xmlsoap.org/soap/envelope/'> \
					<soap:Body> \
					    <GetUserCollectionFromGroup xmlns='http://schemas.microsoft.com/sharepoint/soap/directory/'> \
					      <groupName>" + groupName + "</groupName> \
 					   </GetUserCollectionFromGroup> \
				 	</soap:Body> \
				   </soap:Envelope>";
    $.ajax({
        async: true,
        url: siteUrl + "/_vti_bin/usergroup.asmx",
        beforeSend: function (xhr) {
            xhr.setRequestHeader("SOAPAction",
            "http://schemas.microsoft.com/sharepoint/soap/directory/GetUserCollectionFromGroup");
        },
        type: "POST",
        dataType: "xml",
        data: soapEnv,
        complete: function (data) {
            var xmlData = $(data.responseText);
            var users = xmlData.find("User");
            var contains = false;
            for (var i = 0; i < users.length; i++) {
                var _userId = $(users[i]).attr("id");
                if (_userId == userId)
                    contains = true;
            }

            if (callbackFunction != null)
                callbackFunction(contains)

        },
        success: function (XMLHttpRequest, textStatus, errorThrown) { },
        error: function (XMLHttpRequest, textStatus, errorThrown) { UNFCCC_LogMessage(XMLHttpRequest) },
        contentType: "text/xml; charset=utf-8"
    });
}

soby.SPLibrary.UserGroup.CheckUserRolesAndPermissions = function (siteUrl, callbackFunction) {
    var soapEnv = "<soap:Envelope xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xmlns:xsd='http://www.w3.org/2001/XMLSchema' xmlns:soap='http://schemas.xmlsoap.org/soap/envelope/'> \
					<soap:Body> \
					    <GetRolesAndPermissionsForCurrentUser xmlns='http://schemas.microsoft.com/sharepoint/soap/directory/'></GetRolesAndPermissionsForCurrentUser > \
				 	</soap:Body> \
				   </soap:Envelope>";
    $.ajax({
        async: true,
        url: siteUrl + "/_vti_bin/usergroup.asmx",
        beforeSend: function (xhr) {
            xhr.setRequestHeader("SOAPAction",
            "http://schemas.microsoft.com/sharepoint/soap/directory/GetRolesAndPermissionsForCurrentUser ");
        },
        type: "POST",
        dataType: "xml",
        data: soapEnv,
        complete: function (xData) {
            var xmlData = $(xData.responseText);
            var userPerm = $(xData.responseText).find("Permissions").attr("Value");
            var hasAccessRights = false;
            if (userPerm > 0)
                hasAccessRights = true;

            if (callbackFunction != null)
                callbackFunction(hasAccessRights);

        },
        success: function (XMLHttpRequest, textStatus, errorThrown) { },
        error: function (XMLHttpRequest, textStatus, errorThrown) { UNFCCC_LogMessage(XMLHttpRequest) },
        contentType: "text/xml; charset=utf-8"
    });
}

soby.SPLibrary.UserGroup.GetRolesAndPermissionsForCurrentUser = function (siteUrl) {
    var roles = new Array();
    var soapEnv = "<soap:Envelope xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xmlns:xsd='http://www.w3.org/2001/XMLSchema' xmlns:soap='http://schemas.xmlsoap.org/soap/envelope/'> \
					<soap:Body> \
					    <GetRolesAndPermissionsForCurrentUser xmlns=\"http://schemas.microsoft.com/sharepoint/soap/directory/\" /> \
				 	</soap:Body> \
				   </soap:Envelope>";
    $.ajax({
        async: false,
        url: siteUrl + "/_vti_bin/UserGroup.asmx",
        beforeSend: function (xhr) {
            xhr.setRequestHeader("SOAPAction",
            "http://schemas.microsoft.com/sharepoint/soap/directory/GetRolesAndPermissionsForCurrentUser");
        },
        type: "POST",
        dataType: "xml",
        data: soapEnv,
        complete: function (data) {
            var xmlData = $(data.responseText);
            var _roles = xmlData.find("Role");
            for (var i = 0; i < _roles.length; i++) {
                var id = $(_roles[i]).attr("ID");
                var name = $(_roles[i]).attr("Name");
                var type = $(_roles[i]).attr("Type");

                roles[roles.length] = { ID: id, Name: name, Type: type };
            }
        },
        success: function (XMLHttpRequest, textStatus, errorThrown) { },
        error: function (XMLHttpRequest, textStatus, errorThrown) { soby_LogMessage(XMLHttpRequest) },
        contentType: "text/xml; charset=utf-8"
    });
    return roles;
}

soby.SPLibrary.UserGroup.AddGroup = function (siteUrl, groupName, ownerIdentifier, isAsync) {
    if (isAsync == null)
        isAsync = true;
    var roles = new Array();
    var soapEnv = "<soap:Envelope xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xmlns:xsd='http://www.w3.org/2001/XMLSchema' xmlns:soap='http://schemas.xmlsoap.org/soap/envelope/'> \
					<soap:Body> \
						<AddGroup xmlns=\"http://schemas.microsoft.com/sharepoint/soap/directory/\"> \
					      <groupName>" + groupName + "</groupName> \
					      <ownerIdentifier>" + ownerIdentifier + "</ownerIdentifier> \
					      <ownerType>user</ownerType> \
					      <defaultUserLoginName>" + ownerIdentifier + "</defaultUserLoginName> \
					      <description></description> \
					    </AddGroup> \
   				 	</soap:Body> \
				   </soap:Envelope>";
    $.ajax({
        async: isAsync,
        url: siteUrl + "/_vti_bin/UserGroup.asmx",
        beforeSend: function (xhr) {
            xhr.setRequestHeader("SOAPAction",
            "http://schemas.microsoft.com/sharepoint/soap/directory/AddGroup");
        },
        type: "POST",
        dataType: "xml",
        data: soapEnv,
        complete: function (data) {
        },
        success: function (XMLHttpRequest, textStatus, errorThrown) { },
        error: function (XMLHttpRequest, textStatus, errorThrown) { soby_LogMessage(XMLHttpRequest) },
        contentType: "text/xml; charset=utf-8"
    });
    return roles;
}

soby.SPLibrary.UserGroup.AddUserToGroup = function (siteUrl, groupName, userLoginName, isAsync) {
    if (isAsync == null)
        isAsync = true;
    var roles = new Array();
    var soapEnv = "<soap:Envelope xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xmlns:xsd='http://www.w3.org/2001/XMLSchema' xmlns:soap='http://schemas.xmlsoap.org/soap/envelope/'> \
					<soap:Body> \
						<AddUserToGroup xmlns=\"http://schemas.microsoft.com/sharepoint/soap/directory/\"> \
					      <groupName>" + groupName + "</groupName> \
					      <userName></userName> \
					      <userLoginName>" + userLoginName + "</userLoginName> \
					      <userEmail></userEmail> \
					      <userNotes></userNotes> \
					    </AddUserToGroup> \
   				 	</soap:Body> \
				   </soap:Envelope>";
    $.ajax({
        async: isAsync,
        url: siteUrl + "/_vti_bin/UserGroup.asmx",
        beforeSend: function (xhr) {
            xhr.setRequestHeader("SOAPAction",
            "http://schemas.microsoft.com/sharepoint/soap/directory/AddUserToGroup");
        },
        type: "POST",
        dataType: "xml",
        data: soapEnv,
        complete: function (data) {
        },
        success: function (XMLHttpRequest, textStatus, errorThrown) { },
        error: function (XMLHttpRequest, textStatus, errorThrown) { soby_LogMessage(XMLHttpRequest) },
        contentType: "text/xml; charset=utf-8"
    });
    return roles;
}

soby.SPLibrary.UserGroup.RemoveUserToGroup = function (siteUrl, groupName, userLoginName, isAsync, callbackFunction) {
    if (isAsync == null)
        isAsync = true;
    var roles = new Array();
    var soapEnv = "<soap:Envelope xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xmlns:xsd='http://www.w3.org/2001/XMLSchema' xmlns:soap='http://schemas.xmlsoap.org/soap/envelope/'> \
					<soap:Body> \
						<RemoveUserFromGroup xmlns=\"http://schemas.microsoft.com/sharepoint/soap/directory/\"> \
					      <groupName>" + groupName + "</groupName> \
					      <userLoginName>" + userLoginName + "</userLoginName> \
					    </RemoveUserFromGroup> \
   				 	</soap:Body> \
				   </soap:Envelope>";
    $.ajax({
        async: isAsync,
        url: siteUrl + "/_vti_bin/UserGroup.asmx",
        beforeSend: function (xhr) {
            xhr.setRequestHeader("SOAPAction",
            "http://schemas.microsoft.com/sharepoint/soap/directory/RemoveUserFromGroup");
        },
        type: "POST",
        dataType: "xml",
        data: soapEnv,
        complete: function (data) {
            if (callbackFunction != null)
                callbackFunction();
        },
        success: function (XMLHttpRequest, textStatus, errorThrown) { },
        error: function (XMLHttpRequest, textStatus, errorThrown) { soby_LogMessage(XMLHttpRequest) },
        contentType: "text/xml; charset=utf-8"
    });
    return roles;
}

soby.SPLibrary.Webs = {};
soby.SPLibrary.Webs.GetSites = function (siteUrl, callbackFunction) {
    var soapEnv = "<soap:Envelope xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xmlns:xsd='http://www.w3.org/2001/XMLSchema' xmlns:soap='http://schemas.xmlsoap.org/soap/envelope/'> \
					<soap:Body> \
					    <GetWebCollection xmlns='http://schemas.microsoft.com/sharepoint/soap/directory/'> \
 					   </GetWebCollection> \
				 	</soap:Body> \
				   </soap:Envelope>";
    $.ajax({
        async: true,
        url: siteUrl + "/_vti_bin/webs.asmx",
        beforeSend: function (xhr) {
            xhr.setRequestHeader("SOAPAction",
            "http://schemas.microsoft.com/sharepoint/soap/GetWebCollection");
        },
        type: "POST",
        dataType: "xml",
        data: soapEnv,
        complete: function (data) {
            var sites = new Array();
            var xmlData = $(data.responseText);
            var webs = xmlData.find("Web");
            for (var i = 0; i < webs.length; i++) {
                var title = $(webs[i]).attr("Title");
                var url = $(webs[i]).attr("Url");

                sites[sites.length] = { Title: title, Url: url };
            }
            callbackFunction(siteUrl, sites)

        },
        success: function (XMLHttpRequest, textStatus, errorThrown) { },
        error: function (XMLHttpRequest, textStatus, errorThrown) { soby_LogMessage(XMLHttpRequest) },
        contentType: "text/xml; charset=utf-8"
    });
}

soby.SPLibrary.Sites = {};
soby.SPLibrary.Sites.CreateSubSite = function (siteUrl, subSiteUrl, templateName, title, _arguments, successCallBackFunction, errorCallBackFunction, isAsync) {
    if (templateName == null)
        templateName = "STS#0";
    if (isAsync == null)
        isAsync = false;
    var soapEnv = "<soap:Envelope xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xmlns:xsd='http://www.w3.org/2001/XMLSchema' xmlns:soap='http://schemas.xmlsoap.org/soap/envelope/'> \
					<soap:Body> \
						<CreateWeb xmlns=\"http://schemas.microsoft.com/sharepoint/soap/\"> \
						  <url><![CDATA[" + subSiteUrl + "]]></url> \
						  <title><![CDATA[" + title + "]]></title> \
						  <description><![CDATA[" + title + "]]></description> \
						  <templateName>" + templateName + "</templateName> \
						  <language>1033</language> \
						  <locale>1033</locale> \
						  <collationLocale>1033</collationLocale> \
						  <uniquePermissions>1</uniquePermissions> \
						  <anonymous>1</anonymous> \
						  <presence>1</presence> \
						</CreateWeb> \
					</soap:Body> \
				</soap:Envelope>";

    $.ajax({
        async: isAsync,
        url: siteUrl + "/_vti_bin/Sites.asmx",
        beforeSend: function (xhr) { xhr.setRequestHeader("SOAPAction", "http://schemas.microsoft.com/sharepoint/soap/CreateWeb"); },
        type: "POST",
        dataType: "xml",
        data: soapEnv,
        complete: function processResult(xData, status) {
            if (successCallBackFunction != null)
                successCallBackFunction(_arguments);
        },
        error: function (XMLHttpRequest, textStatus, errorThrown) {
            soby_LogMessage(XMLHttpRequest); soby_LogMessage(textStatus); soby_LogMessage(errorThrown);
            if (errorCallBackFunction != null)
                errorCallBackFunction(_arguments);

        },
        contentType: "text/xml; charset=\"utf-8\""
    });

}

soby.SPLibrary.Sites.DeleteWeb = function (siteUrl, webUrl, _arguments, successCallBackFunction, errorCallBackFunction, isAsync) {
    if (isAsync == null)
        isAsync = false;
    var soapEnv = "<soap:Envelope xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xmlns:xsd='http://www.w3.org/2001/XMLSchema' xmlns:soap='http://schemas.xmlsoap.org/soap/envelope/'> \
					<soap:Body> \
						<DeleteWeb xmlns=\"http://schemas.microsoft.com/sharepoint/soap/\"> \
						  <url><![CDATA[" + webUrl + "]]></url> \
						</DeleteWeb > \
					</soap:Body> \
				</soap:Envelope>";

    $.ajax({
        async: isAsync,
        url: siteUrl + "/_vti_bin/Sites.asmx",
        beforeSend: function (xhr) { xhr.setRequestHeader("SOAPAction", "http://schemas.microsoft.com/sharepoint/soap/DeleteWeb "); },
        type: "POST",
        dataType: "xml",
        data: soapEnv,
        complete: function processResult(xData, status) {
            if (successCallBackFunction != null)
                successCallBackFunction(_arguments);
        },
        error: function (XMLHttpRequest, textStatus, errorThrown) {
            soby_LogMessage(XMLHttpRequest); soby_LogMessage(textStatus); soby_LogMessage(errorThrown);
            if (errorCallBackFunction != null)
                errorCallBackFunction(_arguments);

        },
        contentType: "text/xml; charset=\"utf-8\""
    });

}


soby.SPLibrary.WebPartPages = {};
soby.SPLibrary.WebPartPages.AddContentEditorWebPart = function (siteUrl, pageUrl, properties, callBackFunction, _arguments) {
    var webPartXml = "&lt;?xml version=&quot;1.0&quot; encoding=&quot;utf-16&quot;?&gt;&lt;WebPart xmlns:xsd=&quot;http://www.w3.org/2001/XMLSchema&quot; xmlns:xsi=&quot;http://www.w3.org/2001/XMLSchema-instance&quot; xmlns=&quot;http://schemas.microsoft.com/WebPart/v2&quot;&gt;&lt;Title&gt;Custom Part&lt;/Title&gt;&lt;FrameType&gt;None&lt;/FrameType&gt;&lt;Description&gt;Use for formatted text, tables, and images.&lt;/Description&gt;&lt;IsIncluded&gt;true&lt;/IsIncluded&gt;&lt;ZoneID&gt;Left&lt;/ZoneID&gt; &lt;PartOrder&gt;6&lt;/PartOrder&gt;&lt;FrameState&gt;Normal&lt;/FrameState&gt;&lt;Height /&gt;&lt;Width /&gt; &lt;AllowRemove&gt;true&lt;/AllowRemove&gt;&lt;AllowZoneChange&gt;true&lt;/AllowZoneChange&gt;&lt;AllowMinimize&gt;true&lt;/AllowMinimize&gt;&lt;IsVisible&gt;true&lt;/IsVisible&gt;&lt;DetailLink /&gt;&lt;HelpLink /&gt;&lt;Dir&gt;Default&lt;/Dir&gt;&lt;PartImageSmall /&gt;&lt;MissingAssembly /&gt;&lt;PartImageLarge&gt;/_layouts/images/mscontl.gif&lt;/PartImageLarge&gt;&lt;IsIncludedFilter /&gt;&lt;Assembly&gt;Microsoft.SharePoint, Version=12.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c&lt;/Assembly&gt;&lt;TypeName&gt;Microsoft.SharePoint.WebPartPages.ContentEditorWebPart&lt;/TypeName&gt;"

    for (var i = 0; i < properties.length; i++) {
        var contentXml = properties[i].Value.replace(/</gi, "&lt;").replace(/>/gi, "&gt;").replace(/\"/gi, "&quot;");
        //&lt;![CDATA[  ]]&gt;
        webPartXml += "&lt;" + properties[i].Key + " xmlns=&quot;http://schemas.microsoft.com/WebPart/v2/ContentEditor&quot;&gt;" + contentXml + "&lt;/" + properties[i].Key + "&gt;"
    }
    webPartXml += "&lt;Content xmlns=&quot;http://schemas.microsoft.com/WebPart/v2/ContentEditor&quot; /&gt;"

    webPartXml += " &lt;PartStorage xmlns=&quot;http://schemas.microsoft.com/WebPart/v2/ContentEditor&quot; /&gt;&lt;/WebPart&gt;";

    soby.SPLibrary.WebPartPages.AddWebPart(siteUrl, pageUrl, webPartXml, callBackFunction, _arguments);
}


soby.SPLibrary.WebPartPages.AddWebPart = function (siteUrl, pageUrl, webPartXml, callBackFunction, _arguments) {
    var soapEnv = "<soap:Envelope xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xmlns:xsd='http://www.w3.org/2001/XMLSchema' xmlns:soap='http://schemas.xmlsoap.org/soap/envelope/'> \
					<soap:Body> \
					 <AddWebPart xmlns=\"http://microsoft.com/sharepoint/webpartpages\"> \
						  <pageUrl>" + pageUrl + "</pageUrl> \
						  <webPartXml>" + webPartXml + "</webPartXml> \
						  <storage>Shared</storage> \
					</AddWebPart> \
					</soap:Body> \
				</soap:Envelope>";
    $.ajax({
        url: siteUrl + "/_vti_bin/WebPartPages.asmx",
        beforeSend: function (xhr) { xhr.setRequestHeader("SOAPAction", "http://microsoft.com/sharepoint/webpartpages/AddWebPart"); },
        type: "POST",
        dataType: "xml",
        data: soapEnv,
        complete: function processResult(xData, status) {
            if (callBackFunction != null)
                callBackFunction(_arguments);
        },
        error: function (XMLHttpRequest, textStatus, errorThrown) { soby_LogMessage(XMLHttpRequest); soby_LogMessage(textStatus); soby_LogMessage(errorThrown); },
        contentType: "text/xml; charset=\"utf-8\""
    });
}

soby.SPLibrary.Versions = {};
soby.SPLibrary.Versions.GetVersions = function (siteUrl, filename, callbackFunction) {
    var soapEnv =
        "<?xml version=\"1.0\" encoding=\"utf-8\"?> \
        <soap:Envelope xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance/\" \
            xmlns:xsd=\"http://www.w3.org/2001/XMLSchema/\" \
            xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\"> \
          <soap:Body> \
            <GetVersions xmlns=\"http://schemas.microsoft.com/sharepoint/soap/\"> \
              <fileName><![CDATA[" + filename + "]]></fileName> \
            </GetVersions> \
          </soap:Body> \
        </soap:Envelope>";


    $.ajax({
        async: false,
        url: siteUrl + "/_vti_bin/versions.asmx",
        beforeSend: function (xhr) {
            xhr.setRequestHeader("SOAPAction",
            "http://schemas.microsoft.com/sharepoint/soap/GetVersions");
        },
        type: "POST",
        dataType: "xml",
        data: soapEnv,
        complete: function (data) { if (callbackFunction != null) callbackFunction(data); },
        success: function (XMLHttpRequest, textStatus, errorThrown) { soby_LogMessage(XMLHttpRequest) },
        error: function (XMLHttpRequest, textStatus, errorThrown) { soby_LogMessage(XMLHttpRequest) },
        contentType: "text/xml; charset=utf-8"
    });
}

soby.SPLibrary.Versions.GetItemVersions = function (siteUrl, listName, xmlQuery, callbackFunction) {
    var objClientCtx = new SP.ClientContext.get_current();
    var oWeb = objClientCtx.get_web();
    var oList = oWeb.get_lists().getByTitle(listName);
    var query = new SP.CamlQuery();
    query.set_viewXml(xmlQuery);
    var objlistItems = oList.getItems(query);
    objClientCtx.load(objlistItems);
    objClientCtx.executeQueryAsync(function (sender, args) {
        //that.DataSet = [];
        var objlistEnumerator = objlistItems.getEnumerator();
        while (objlistEnumerator.moveNext()) {
            var objListItem = objlistEnumerator.get_current();
            var itemId = objListItem.get_item('ID');
            var filePath = siteUrl + '/Lists/' + listName + '/' + itemId + '_.000'
            var web = objClientCtx.get_web();
            var listItemInfo = web.getFileByServerRelativeUrl(filePath)
            var listItemFields = listItemInfo.get_listItemAllFields()
            objClientCtx.load(web);
            objClientCtx.load(listItemInfo);
            objClientCtx.load(listItemFields);
            //objClientCtx.load(versions1);
            objClientCtx.executeQueryAsync(
                function (sender, args) {
                    var fileVersions = listItemInfo.get_versions();
                    objClientCtx.load(fileVersions);
                    objClientCtx.executeQueryAsync(
                        function (sender, args) {
                            var objlistVersionEnumerator = fileVersions.getEnumerator();
                            while (objlistVersionEnumerator.moveNext()) {
                                var objCurrentListItemVersion = objlistVersionEnumerator.get_current();
                                var versionId = objCurrentListItemVersion.get_id();
                                var $div = $('<div>');
                                $div.load(siteUrl + '/Lists/' + listName + '/DispForm.aspx?ID=' + itemId + '&VersionNo=' + versionId + ' table.ms-formtable', function () {
                                    var table = $(this).find('table.ms-formtable');
                                    var tr = $(table).find('tr');
                                    $(tr).each(function () {
                                        var row = $(this);
                                        var columnName = $.trim(row.find('td:eq(0)').text());
                                        var columnValue = $.trim(row.find('td:eq(1)').text());
                                    });

                                });
                            }

                        },
                        function (sender, args) { console.log('Error'); }
                    )

                },
                function (sender, args) {
                    console.log(sender)
                    console.log(args)
                    console.log('error')
                });

        }
        callbackFunction();

    }, function (sender, args) {
        that._onGetFail(sender, args);
    });
}


soby.SPLibrary.Versions.GetVersionCollection = function (siteUrl, listID, itemID, fieldName, callbackFunction) {
    var soapEnv =
        "<?xml version=\"1.0\" encoding=\"utf-8\"?> \
        <soap:Envelope xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance/\" \
            xmlns:xsd=\"http://www.w3.org/2001/XMLSchema/\" \
            xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\"> \
          <soap:Body> \
            <GetVersionCollection xmlns=\"http://schemas.microsoft.com/sharepoint/soap/\"> \
              <strlistID><![CDATA[" + listID + "]]></strlistID> \
              <strlistItemID><![CDATA[" + itemID + "]]></strlistItemID> \
              <strFieldName><![CDATA[" + fieldName + "]]></strFieldName> \
            </GetVersionCollection> \
          </soap:Body> \
        </soap:Envelope>";


    $.ajax({
        async: false,
        url: siteUrl + "/_vti_bin/lists.asmx",
        beforeSend: function (xhr) {
            xhr.setRequestHeader("SOAPAction", "http://schemas.microsoft.com/sharepoint/soap/GetVersionCollection");
        },
        type: "POST",
        dataType: "xml",
        data: soapEnv,
        complete: function (data) { if (callbackFunction != null) callbackFunction(data); },
        success: function (XMLHttpRequest, textStatus, errorThrown) { soby_LogMessage(XMLHttpRequest) },
        error: function (XMLHttpRequest, textStatus, errorThrown) { soby_LogMessage(XMLHttpRequest) },
        contentType: "text/xml; charset=utf-8"
    });
}

soby.SPLibrary.Features = {};
soby.SPLibrary.Features.ActivateSiteFeature = function (siteUrl, featureGuid, successCallback, errorCallback) {
    var clientContext = new SP.ClientContext(siteUrl);
    var site = clientContext.get_site();
    var guid = new SP.Guid('{' + featureGuid + '}');

    var featDef = site.get_features().add(guid, false, SP.FeatureDefinitionScope.site);

    clientContext.executeQueryAsync(Function.createDelegate(this, successCallback), Function.createDelegate(this, errorCallback));
}

soby.SPLibrary.Permissions = {};
soby.SPLibrary.Permissions.AddPermissionCollection = function (siteUrl, objectName, objectType, permissions, callbackFunction, isAsync) {
    if (isAsync == null)
        isAsync = false;
    var rootContainer = $("<root></root>");
    var permissionsContainer = $("<Permissions></Permissions>");
    var usersContainer = $("<Users></Users>");
    var groupsContainer = $("<Groups></Groups>");
    var rolesContainer = $("<Roles></Roles>");
    rootContainer.append(permissionsContainer);
    permissionsContainer.append(usersContainer);
    permissionsContainer.append(groupsContainer);
    permissionsContainer.append(rolesContainer);

    if (permissions.Users != null) {
        for (var i = 0; i < permissions.Users.length; i++) {
            var userNode = $("<User></User>");
            userNode.attr("LoginName", permissions.Users[i].LoginName);
            userNode.attr("PermissionMask", permissions.Users[i].PermissionMask);
            usersContainer.append(userNode);
        }
    }

    if (permissions.Groups != null) {
        for (var i = 0; i < permissions.Groups.length; i++) {
            var groupNode = $("<Group></Group>");
            groupNode.attr("GroupName", permissions.Groups[i].GroupName);
            groupNode.attr("PermissionMask", permissions.Groups[i].PermissionMask);
            groupsContainer.append(groupNode);
        }
    }

    if (permissions.Roles != null) {
        for (var i = 0; i < permissions.Roles.length; i++) {
            var roleNode = $("<Role></Role>");
            roleNode.attr("RoleName", permissions.Roles[i].RoleName);
            roleNode.attr("PermissionMask", permissions.Roles[i].PermissionMask);
            rolesContainer.append(roleNode);
        }
    }

    var soapEnv = "<soap:Envelope xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xmlns:xsd='http://www.w3.org/2001/XMLSchema' xmlns:soap='http://schemas.xmlsoap.org/soap/envelope/'> \
					<soap:Body> \
					    <AddPermissionCollection xmlns='http://schemas.microsoft.com/sharepoint/soap/directory/'>" +
						  "<objectName><![CDATA[" + objectName + "]]></objectName>" +
						  "<objectType><![CDATA[" + objectType + "]]></objectType>" +
						  "<permissionsInfoXml>" + rootContainer.html() + "</permissionsInfoXml>" +
						  "</AddPermissionCollection> \
				 	</soap:Body> \
				   </soap:Envelope>";

    $.ajax({
        async: isAsync,
        url: siteUrl + "/_vti_bin/Permissions.asmx",
        beforeSend: function (xhr) {
            xhr.setRequestHeader("SOAPAction",
            "http://schemas.microsoft.com/sharepoint/soap/directory/AddPermissionCollection");
        },
        type: "POST",
        dataType: "xml",
        data: soapEnv,
        complete: function (xData) {
            if (callbackFunction != null)
                callbackFunction();

        },
        success: function (XMLHttpRequest, textStatus, errorThrown) { },
        error: function (XMLHttpRequest, textStatus, errorThrown) { UNFCCC_LogMessage(XMLHttpRequest) },
        contentType: "text/xml; charset=utf-8"
    });
}
