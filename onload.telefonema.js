function init(){
	debugger;
	if(VerificarConcorrencia()){
		var itemFilaId = getParameterByName('fila_telefonema');
		if(itemFilaId){
			var queueItem = new Object();
			queueItem.WorkerId = new Object();
			queueItem.WorkerId.Id = Xrm.Page.context.getUserId();
			queueItem.WorkerId.LogicalName = 'systemuser';
			updateRecord(itemFilaId, queueItem, "QueueItemSet", function(){}, function(){}, false);
		}
	}
}

function VerificarConcorrencia(){
	var phoneCallId = Xrm.Page.data.entity.getId();
	var retorno = true;
	var fetchxml = [
	'<fetch version="1.0" output-format="xml-platform" mapping="logical" distinct="false">',
	'  <entity name="queueitem">',
	'    <attribute name="objecttypecode" />',
	'    <attribute name="objectid" />',
	'    <attribute name="title" />',
	'    <attribute name="enteredon" />',
	'    <order attribute="enteredon" descending="true" />',
	'    <filter type="and">',
	'      <condition attribute="workerid" operator="ne-userid" />',
	'    </filter>',
	'    <link-entity name="phonecall" from="activityid" to="objectid" alias="aa">',
	'      <filter type="and">',
	'        <condition attribute="activityid" operator="eq" uitype="phonecall" value="' + phoneCallId + '" />',
	'      </filter>',
	'    </link-entity>',
	'  </entity>',
	'</fetch>'
	].join('');

	CrmFetchKit.Fetch(fetchxml, false).then(function(entities){
		if(entities[0] != undefined) {
			alert("Esse item já esta sendo trabalhado por alguem.")
			retorno = false;
		}
	});
	return retorno;
}

function AtualizarEntidadeCRMRequisicaoAjax(url, data, guid, successCallback, errorCallback, chamadaAssincrona) {

	var jsonEntidade = JSON.stringify(data);

	if ((chamadaAssincrona === undefined) || (chamadaAssincrona === null)) {
		chamadaAssincrona = true;
	}

	var urlServidor = document.location.protocol + '//' + document.location.host + "/";

	if(document.location.href.indexOf('dynamics') == -1){
		urlServidor += document.location.href.split('/')[3];
	}

	var ODATA_ENDPOINT = "/XRMServices/2011/OrganizationData.svc";

	$.ajax({
		type: "PUT",
		contentType: "application/json; charset=utf-8",
		datatype: "json",
		data: jsonEntidade,
		url: urlServidor + ODATA_ENDPOINT + "/" + url + "%28guid%27" + guid + "%27%29",
		async: chamadaAssincrona,
		beforeSend: function (XMLHttpRequest) {
			XMLHttpRequest.setRequestHeader("Accept", "application/json");

		},

		success: function (data, textStatus, XmlHttpRequest) {
			if (successCallback) {
				successCallback(data, textStatus, XmlHttpRequest);
			}
		},
		error: function (XmlHttpRequest, textStatus, errorThrown) {
			if (errorCallback)
				errorCallback(XmlHttpRequest, textStatus, errorThrown);
			else
				alert("Erro ao criar registro; Detalhes do Erro – " + errorThrown);
		}
	});
}

function getParameterByName(name) {
	name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
	var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
	results = regex.exec(location.search);
	return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

function hasItemChanged(executionObj, modifiedObject) {
    CheckIfModifiedUsingRest(_schemaName, modifiedObject);
    return _recordLoadedOn.getTime() < modifiedObject.lastModifiedOn.getTime();
}

function CheckIfModifiedUsingRest(entitySchemaName, modifiedObject) {
    var context = Xrm.Page.context;
    var serverUrl = context.getClientUrl() + "/XRMServices/2011/OrganizationData.svc/";

    var oDataRequest = serverUrl + entitySchemaName + "Set(guid'" + Xrm.Page.data.entity.getId() + "')?$select=ModifiedOn,ModifiedBy";

    //Asynchronous AJAX function to Retrieve a CRM record using OData 
    $.ajax({
        type: "GET",
        contentType: "application/json; charset=utf-8",
        datatype: "json",
        async: false,
        url: oDataRequest,
        beforeSend: function (XMLHttpRequest) {
            //Specifying this header ensures that the results will be returned as JSON.              
            XMLHttpRequest.setRequestHeader("Accept", "application/json");
        },
        success: function (data, textStatus, XmlHttpRequest) {
            if (textStatus == "success") {
                modifiedObject.modifiedBy = data.d.ModifiedBy.Name;
                modifiedObject.lastModifiedOn = new Date(parseInt(data.d.ModifiedOn.substr(6)));
            }
        },
        error: function (XmlHttpRequest, textStatus, errorThrown) {
            //TODO handle error here
            errorHandler(XmlHttpRequest, textStatus, errorThrown);
        }
    });

}