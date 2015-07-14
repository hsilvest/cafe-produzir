function BuscarFilas() {
	PesquisarEntidadeCRMRequisicaoAjax("QueueSet?", function(retrieveReq){
		$(retrieveReq.results).each(function(index, element){
			$(".dropdown-menu").first().append("<li><a href='#' onClick='BuscarProximoItemFila(this)' data-id='" + element.QueueId + "'>" + format(element.Name) + "</a></li>");
		});
	}, null, false);
}

function BuscarProximoItemFila(element){
	showLoadingMessage();
	var filaId = $(element).attr("data-id");
	var fetchxml = ['<fetch version="1.0" output-format="xml-platform" mapping="logical" distinct="true">',
	'  <entity name="phonecall">',
	'    <attribute name="activityid" />',
	'    <attribute name="subject" />',
	'    <order attribute="cad_datadoagendamento" descending="false" />',
	'    <filter type="and">',
	'      <filter type="or">',
	'        <condition attribute="cad_datadoagendamento" operator="null" />',
	'        <condition attribute="cad_datadoagendamento" operator="on-or-before" value="' + getDate() + '" />',
	'      </filter>',
	'      <condition attribute="statecode" operator="eq" value="0" />',
	'    </filter>',
	'    <link-entity name="queueitem" from="objectid" to="activityid" alias="ab">',
	'    <attribute name="queueitemid" />',
	'    <order attribute="createdon" descending="false" />',
	'      <filter type="and">',
	'        <condition attribute="queueid" operator="eq" uitype="queue" value="{' + filaId + '}" />',
	'        <condition attribute="objecttypecode" operator="eq" value="4210" />',
	'        <filter type="or">',
	'          <condition attribute="workerid" operator="null" />',
	'          <condition attribute="workerid" operator="eq-userid" />',
	'        </filter>',
	'      </filter>',
	'    </link-entity>',
	'  </entity>',
	'</fetch>'].join('');

	CrmFetchKit.Fetch(fetchxml).then(function(entities){
console.log(entities)
}

function getDate() {
	var d = new Date(),
	month = '' + (d.getMonth() + 1),
	day = '' + d.getDate(),
	year = d.getFullYear();

	if (month.length < 2) month = '0' + month;
	if (day.length < 2) day = '0' + day;

	return [year, month, day].join('-');
}

function VerificarItemFilaUsuarioLogado(filaId){
	var retorno = false;
	var userId = window.parent.Xrm.Page.context.getUserId();
	PesquisarEntidadeCRMRequisicaoAjax("QueueItemSet?$select=PhoneCall_QueueItem/ActivityId&$expand=" + 
		"PhoneCall_QueueItem&$filter=ObjectTypeCode/Value eq 4210 and QueueId/Id eq guid'" + filaId + "'" + 
		"and WorkerId/Id eq guid'" + userId + "'" , function(retrieveReq){
			if(retrieveReq[0] == undefined){
				retorno = true;
			}
		}, null, false);
	return retorno;
}

function InserirEntidadeCRM(entidade, data, successCallback, errorCallback) {
	InserirEntidadeCRMRequisicaoAjax(entidade, data, successCallback, errorCallback);
}

function AtualizarEntidadeCRM(entidade, data, guid, campos, successCallback, errorCallback, chamadaAssincrona) {
	AtualizarEntidadeCRMRequisicaoAjax(entidade + "(guid'" + guid + "')/" + campos, data, successCallback, errorCallback, chamadaAssincrona);
}

function PesquisarEntidadeCRMRequisicaoAjax(url, successCallback, errorCallback, chamadaAssincrona) {
	if(document.location.href.indexOf('dynamics') > -1){
		url = document.location.protocol + "//" + document.location.host + "//XRMServices/2011/OrganizationData.svc/" + url;
	} else {
		url = document.location.protocol + "/" +  document.location.href.split('/')[3] +  "/XRMServices/2011/OrganizationData.svc/" + url;
	}
	$.ajax({
		type: "GET",
		contentType: "application/json; charset=utf-8",
		datatype: "json",
		url: url,
		async: chamadaAssincrona,
		beforeSend: function (XMLHttpRequest) {
			XMLHttpRequest.setRequestHeader("Accept", "application/json");

		},

		success: function (data, textStatus, XmlHttpRequest) {
			if (successCallback) {
				successCallback(data.d, textStatus, XmlHttpRequest);
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


function AtualizarEntidadeCRMRequisicaoAjax(url, data, successCallback, errorCallback, chamadaAssincrona) {

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
		url: urlServidor + ODATA_ENDPOINT + "/" + url,
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
function format(text){
	return text.replace("<","&#60").replace(">","&#62");
}
$(function(){
	$("#btn-submit").addClass("disabled");
	BuscarFilas();
});

function GetUrlServidor(){
	if(document.location.href.indexOf('dynamics') > -1){
		return document.location.protocol + "//" + document.location.host;
	} else {
		return document.location.protocol + "/" +  document.location.href.split('/')[3] + "/main.aspx?";
	}
}

function GetUrlProximoItemFila(itemId, IdItemFila){
	var url = GetUrlServidor();
	return url + "etc=4210&extraqs=fila_telefonema=" + IdItemFila + "&histKey=936504533&id=" + itemId + "&newWindow=true&pagetype=entityrecord#522980662";
}

function AdicionaEventoClickBotao(url){
	$("#btn-submit").unbind('click').click(function(){
		window.open(url);
		$("#btn-submit").addClass("disabled");
		$("#dropdownlbl").text("Filas Disponíveis");
	});
}

function showLoadingMessage() {
	//tdAreas.style.display = 'none';
	var newdiv = document.createElement('div');
	newdiv.setAttribute('id', "msgDiv");
	newdiv.valign = "middle";
	newdiv.align = "center";
	var divInnerHTML = "<table height='100%' width='100%' style='cursor:wait'>";
	divInnerHTML += "<tr>";
	divInnerHTML += "<td valign='middle' align='center'>";
	divInnerHTML += "<img alt='' src='/_imgs/AdvFind/progress.gif'/>";
	divInnerHTML += "<div/><b>Carregando...</b>";
	divInnerHTML += "</td></tr></table>";
	newdiv.innerHTML = divInnerHTML;
	newdiv.style.background = '#FFFFFF';
	newdiv.style.fontSize = "15px";
	newdiv.style.zIndex = "1010";
	newdiv.style.width = document.body.clientWidth;
	newdiv.style.height = document.body.clientHeight;
	newdiv.style.position = 'absolute';
	document.body.insertBefore(newdiv, document.body.firstChild);
	$("#msgDiv").show();
}