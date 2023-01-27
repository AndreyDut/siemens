import soaService from "soa/kernel/soaService";
import messagingService from "js/messagingService";
import cdm from "soa/kernel/clientDataModel";
import dms from "soa/dataManagementService";
import eventBus from "js/eventBus";
import browserUtils from "js/browserUtils";
import app from "app";
import tcVMOService from "js/tcViewModelObjectService";
import _ from "lodash";
import awColumnService from "js/awColumnService";

const emptyUid = "AAAAAAAAAAAAAA";
let updateCounter = 0;
let autosaveStatus = true;

//
function getEmptyCard(generalDataRemark) {
  return {
    relationInfo: {
      relationTypeName: '',
      actionTypeName: generalDataRemark.generalSelectDocDP.propInternalValue,
      actionTypeDisplayName: generalDataRemark.generalSelectDocDP.propDisplayValue,
    },
    dataObject: null,
    attachmentData: [],
    spb5RemarkApprove: spb5RemarkApprove.generalDataRemark
    // ...generalDataRemark,
  };
}

export async function getDocsForCard(subCtx, data) {
  if (!subCtx.attachmentData.length) {
    return {
      docs: [],
      totalFound: 0,
    };
  }
  const docs = [];
  const uids = [];
  for (const data of subCtx.attachmentData) {
    uids.push(data.attachment.uid, data.relation.uid);
  }
  await dms.getProperties(uids, ["spd5_Zadel", "spd5_dm", "object_string"]);

  for (const data of subCtx.attachmentData) {
    const vmoDoc = await tcVMOService.createViewModelObjectById(
      data.attachment.uid
    );
    const vmoRel = await tcVMOService.createViewModelObjectById(
      data.relation.uid
    );
    if (vmoRel.props.spd5_Zadel) {
      vmoDoc.props.spd5_Zadel = _.cloneDeep(vmoRel.props.spd5_Zadel);
      data.spd5_Zadel = vmoRel.props.spd5_Zadel.dbValue;
    }
    if (vmoRel.props.spd5_dm) {
      vmoDoc.props.spd5_dm = _.cloneDeep(vmoRel.props.spd5_dm);
      //!!!!! temporary mass is runtime without setter and getter
      vmoDoc.props.spd5_dm.isPropertyModifiable = false;
      vmoDoc.props.spd5_dm.isEditable = false;

      data.spd5_dm = vmoRel.props.spd5_dm.dbValue;
    }
    docs.push(vmoDoc);
  }
  data.dataProviders.docsDataProvider.update(
    docs,
    subCtx.attachmentData.length
  );
  return { docs, totalFound: subCtx.attachmentData.length };
}

export async function updateZadelRequest(subCtx, selection, unsavedStatus) {
  if (
    !selection ||
    !subCtx.attachmentData ||
    subCtx.attachmentData.length == 0
  ) {
    return;
  }
  const attachData = subCtx.attachmentData.find(
    (i) => i.attachment.uid === selection.uid
  );
  if (attachData && attachData.spd5_Zadel !== undefined) {
    if (attachData.spd5_Zadel != selection.props.spd5_Zadel.dbValue) {
      attachData.spd5_Zadel = selection.props.spd5_Zadel.dbValue;
      unsavedStatus.dbValue = true;
      await updatePropertyBySoa(
        attachData.relation,
        "spd5_Zadel",
        selection.props.spd5_Zadel.selectedLovEntries[0].propInternalValue,
        unsavedStatus
      );
    }
  }
}

export function openCard(data) {
  console.log(data);
}

export async function handlerCheckbox(data) {
  console.log(data);
  // let test = await siswSoaCallWrapper("Funs-2021-12-AWC", "curdRemarksForm", {})
  // console.log(test)
}

async function updatePropertyBySoa(
  mo,
  propName,
  propValue,
  unsavedStatus,
  timeoutList
) {
  if (timeoutList) {
    timeoutList = timeoutList.filter((i) => i.uid !== mo.uid);
  }
  await siswSoaCallWrapper("Core-2007-01-DataManagement", "setProperties", {
    objects: [{ uid: mo.uid }],
    attributes: {
      [propName]: {
        stringVec: [propValue],
      },
    },
  });
  unsavedStatus.dbValue = false;
}

export function addCard(cards, ctx) {
    console.log("cards", cards)
    console.log("ctx", ctx)
  cards.push(getEmptyCard(ctx.generalDataRemark));
  setTimeout(() => {
    eventBus.publish("generalGrid.plTable.clientRefresh");
  }, 2000);
}


export function copyCard(cards, cardData) {
    let copyElem = {
        relationInfo: cardData.relationInfo,
        dataObject: cardData.attachmentData,
        attachmentData: cardData.attachmentData,
        generalSelectDocDP: cardData.generalSelectDocDP,
        generalSelectCodeDP: cardData.generalSelectCodeDP,
        descRemark: cardData.descRemark,
        descAnswerRemark: cardData.descAnswerRemark,
        spb5RemarkApprove: cardData.spb5RemarkApprove,
      };
    console.log("cards", cards)
    console.log("cardData", cardData)
    cards.push(copyElem);
    setTimeout(() => {
      eventBus.publish("generalGrid.plTable.clientRefresh");
    }, 2000);
}


export function log(data, ctx) {
  console.log(data);
  console.log(ctx);
}

export async function addRelation(cardData, docs, parentUid, objectTypes) {
  cardData.attachmentData = [];
  docs.forEach((item) => {
    if (objectTypes.indexOf(item.type) !== -1)
      cardData.attachmentData.push({
        attachment: { uid: item.uid },
        relation: { uid: "" },
      });
  });
  const input = {
    cnCreationData: [
      {
        changeNotice: { uid: parentUid },
        affectedObjects: [
          {
            relationInfo: cardData.relationInfo,
            dataObject: cardData.dataObject ? cardData.dataObject : { uid: "" },
            attachmentData: cardData.attachmentData,
          },
        ],
      },
    ],
  };
  await siswSoaCallWrapper(
    "Helper-2018-11-ChangeManagement",
    "createCNAttachments",
    input
  );
}

export async function removeCard(cardData) {
  if (cardData.dataObject) {
    const input = cardData.attachmentData.map((a) => ({
      attachment: { uid: a.attachment.uid },
      relation: { uid: a.relation.uid },
    }));
    await siswSoaCallWrapper(
      "Helper-2018-11-ChangeManagement",
      "deleteCNAttachments",
      { attachments: input }
    );
    eventBus.publish("siswru.updateCNBlocks");
  } else {
    eventBus.publish("siswru.removeEmptyCard");
  }
}

export function removeEmptyCard(pomContainers) {
  pomContainers.pop();
}

export async function cutDocContinue(cardData, docs) {
  const uidsToRemove = docs.map((item) => item.uid);
  const attachments = cardData.attachmentData.filter(
    (item) => uidsToRemove.indexOf(item.attachment.uid) !== -1
  );
  await siswSoaCallWrapper(
    "Helper-2018-11-ChangeManagement",
    "deleteCNAttachments",
    {
      attachments: attachments.map((a) => ({
        attachment: { uid: a.attachment.uid },
        relation: { uid: a.relation.uid },
      })),
    }
  );
}

let timeoutContainer = [];
export function updateDescriptionRequst(cardData, desc, unsavedStatus) {
  if (cardData.descRemark.remarkLong !== desc) {
    unsavedStatus.dbValue = true;
    cardData.descRemark.remarkLong = desc;
    let timeout = timeoutContainer.find(
      (item) => item.uid === cardData.dataObject.uid
    );
    if (timeout) {
      clearTimeout(timeout.timeoutId);
      timeoutContainer = timeoutContainer.filter(
        (item) => item.uid !== cardData.dataObject.uid
      );
    }
    let timeoutId = setTimeout(async function () {
      await updateOneDesc(cardData, unsavedStatus);
    }, 3000);
    timeoutContainer.push({
      timeoutId,
      uid: cardData.dataObject.uid,
    });
  }
}
export function updateDescriptionRequst2(cardData, desc, unsavedStatus) {
    console.log("CALL_UPDATE", cardData, desc, unsavedStatus)
  if (cardData.descAnswerRemark.answerRemarkLong !== desc) {
    unsavedStatus.dbValue = true;
    cardData.descAnswerRemark.answerRemarkLong = desc;
    let timeout = timeoutContainer.find(
      (item) => item.uid === cardData.dataObject.uid
    );
    if (timeout) {
      clearTimeout(timeout.timeoutId);
      timeoutContainer = timeoutContainer.filter(
        (item) => item.uid !== cardData.dataObject.uid
      );
    }
    let timeoutId = setTimeout(async function () {
      await updateOneDesc(cardData, unsavedStatus);
    }, 3000);
    timeoutContainer.push({
      timeoutId,
      uid: cardData.dataObject.uid,
    });
  }
}
export async function updateOneDesc(cardData, unsavedStatus) {
  if (cardData.dataObject) {
    const moArray = [{ uid: cardData.dataObject.uid }];
    const valueArray = [cardData.remarkText];
    timeoutContainer = timeoutContainer.filter(
      (item) => item.uid !== cardData.dataObject.uid
    );
    await siswSoaCallWrapper(
      "Helper-2018-11-ChangeManagement",
      "updateDescriptions",
      { descriptionMap: [moArray, valueArray] }
    );
    unsavedStatus.dbValue = false;
  }
}

export async function updateActionTypeRequst(cardData, actionType, ctx) {
  if (actionType && cardData.relationInfo.actionTypeName != actionType) {
    const selectedType = ctx.generalSelectDocDP.find(
      (item) => item.propInternalValue === actionType
    );
    cardData.relationInfo.actionTypeName = selectedType.propInternalValue;
    cardData.relationInfo.actionTypeDisplayName = selectedType.propDisplayValue;
    cardData.relationInfo.relationTypeName = selectedType.relationTypeName;
    if (cardData.dataObject) {
      const updateInput = [
        {
          relationInfo: cardData.relationInfo,
          dataObject: { uid: cardData.dataObject.uid },
          attachmentData: cardData.attachmentData.map((a) => ({
            attachment: { uid: a.attachment.uid },
            relation: { uid: a.relation.uid },
          })),
        },
      ];
      await siswSoaCallWrapper(
        "Helper-2018-11-ChangeManagement",
        "updateCNAttachments",
        { updateInput }
      );
      eventBus.publish("siswru.updateCNBlocks");
    }
  }
}
export function getObjectTypes(objectTypes) {
  return objectTypes.map((item) => ({
    searchFilterType: "StringFilter",
    stringValue: item,
  }));
}
export function addToOutput(container, item) {
  const addedItem = container.find((obj) => obj.uid === item.uid);
  if (!addedItem) {
    container.push(item);
  }
}
export function removeFromOutput(container, item) {
  container = container.filter((obj) => obj.uid !== item.uid);
  return { container };
}
export async function initialGetCNData(uid, ctx) {
  autosaveStatus = ctx.autoSave.dbValue;
  ctx.autoSave.dbValue = false;
  updateCounter = 0;
  const resp = await siswSoaCallWrapper(
    "Helper-2018-11-ChangeManagement",
    "getCNData",
    { changeNoticeRevisions: [{ uid }] }
  );
  let generalSelectDocDP = resp.relationInfo.map((item) => ({
    propDisplayValue: item.actionTypeDisplayName,
    propInternalValue: item.actionTypeName,
    relationTypeName: item.relationTypeName,
  }));
  let curdRemarksForm;
  let generalDataRemark;

  try {
    console.log("ctx.selected", ctx.selected);

    let inputDataRemarks = {
      inputData: {
        selectObject: ctx.selected,
        remarks: [],
      },
    };

    console.log("inputDataRemarks", inputDataRemarks);

    curdRemarksForm = await siswSoaCallWrapper(
        "Funs-2021-12-AWC",
        "curdRemarksForm",
        inputDataRemarks
      );
      
    generalDataRemark = curdRemarksForm.remarks ? curdRemarksForm.remarks[0] : {};
    console.log("curdRemarksForm", curdRemarksForm);
  } catch (error) {
    console.log(error)
  }

  let descRemark = {
    remarkLong: generalDataRemark.spb5RemarkNotesLong,
    remakUser:     {
      dbValue: generalDataRemark.spb5RemarkUser,
      dispValue: generalDataRemark.spb5RemarkUser,
      },
    remarkRole: {
      dbValue: generalDataRemark.spb5RemarkRemarkerRole,
      dispValue: generalDataRemark.spb5RemarkRemarkerRole,
      },
    remarkDate: {
      dbValue: new Date(generalDataRemark.spb5RemarkCreateDate).toLocaleString(),
      dispValue: new Date(generalDataRemark.spb5RemarkCreateDate).toLocaleString(),
      },
  }

  let descAnswerRemark = {
    answerRemarkLong: generalDataRemark.spb5RemarkDesicionLong,
    answerRemakUser:     {
      dbValue: generalDataRemark.spb5RemarkAnsweringUser,
      dispValue: generalDataRemark.spb5RemarkAnsweringUser,
      },
    answerRemarkRole: {
      dbValue: generalDataRemark.spb5RemarkAnsweringRole,
      dispValue: generalDataRemark.spb5RemarkAnsweringRole,
      },
    answerRemarkDate: {
      dbValue: new Date(generalDataRemark.spb5RemarkLastChangeDate).toLocaleString() ,
      dispValue: new Date(generalDataRemark.spb5RemarkLastChangeDate).toLocaleString() ,
      },
  }

  generalSelectDocDP = [
    {
      propDisplayValue: generalDataRemark.spb5KDName,
      propInternalValue: generalDataRemark.spb5KDName,
    },
  ];

  let generalSelectCodeDP = [
    {
      propDisplayValue: generalDataRemark.spb5RemarkCode,
      propInternalValue: generalDataRemark.spb5RemarkCode,
    },
  ];


  generalDataRemark = {
    ...generalDataRemark,
    generalSelectDocDP,
    generalSelectCodeDP,
    descRemark,
    descAnswerRemark,
  }

  let pomContainers = resp.relationDataMap[1][0];
  await processCardsData(pomContainers);
  if (!pomContainers.length) {
    pomContainers.push(getEmptyCard(generalDataRemark));
  }
  
  console.log("ctx", ctx);
  console.log("generalSelectDocDP", generalSelectDocDP);
  console.log(pomContainers);

  return {
    pomContainers,
    generalDataRemark
  };
}

async function processCardsData(pomContainers) {
  const uids = pomContainers.map((item) => item.dataObject.uid);
  await dms.getProperties(uids, ["spd5_CNDescription", "spd5_CN_Definition"]);
  await dms.loadObjects(uids);
  await cdm.getObjects(uids);
  //prepare old relations
  const oldRelationsArrayUids = pomContainers
    .filter((item) => item.dataObject.uid == emptyUid)
    .map((item) => item.attachmentData[0].relation.uid);
  if (oldRelationsArrayUids.length) {
    await dms.getProperties(oldRelationsArrayUids, [
      "spd5_CN_Definition",
      "spd5_CNDescription",
    ]);
    await dms.loadObjects(oldRelationsArrayUids);
    await cdm.getObjects(oldRelationsArrayUids);
  }

  pomContainers.forEach(async (item) => {
    if (item.dataObject && item.dataObject.uid !== emptyUid) {
      const value = item.dataObject.props.spd5_CNDescription.dbValues[0];
      item.remarkText = value ? value : "";
    } else {
      let value;
      if (item.attachmentData[0].relation.type == "CMHasImpactedItem") {
        value =
          item.attachmentData[0].relation.props.spd5_CNDescription.dbValues[0];
      } else {
        value =
          item.attachmentData[0].relation.props.spd5_CN_Definition.dbValues[0];
      }
      item.remarkText = value ? value : "";
    }
  });
  console.log(pomContainers);
}

export async function siswSoaCallWrapper(serviceName, operationName, body) {
  return soaService.post(serviceName, operationName, body).catch((err) => {
    messagingService.showError(err.message);
    throw err;
  });
}

export function cleanData(ctx) {
  ctx.autoSave.dbValue = autosaveStatus;
  timeoutContainer = [];
  updateCounter = 0;
}
export async function loadColumns(uwDataProvider, relationInfo) {
  var awColumnInfos = [];

  awColumnInfos.push(
    createColumn("object_string", "Наименование", 300, 100, false)
  );
  if (relationInfo.relationTypeName === "CMHasImpactedItem") {
    awColumnInfos.push(
      createColumn("spd5_Zadel", "Указание о задаеле", 150, 50, true)
    );
  }
  if (relationInfo.actionTypeName === "Ввести взамен") {
    awColumnInfos.push(
      createColumn("spd5_dm", "Изменение массы", 150, 50, false)
    );
  }

  uwDataProvider.columnConfig = {
    columns: awColumnInfos,
  };
}
function createColumn(name, displayName, width, minWidth, editable) {
  return awColumnService.createColumnInfo({
    name,
    displayName,
    isTableCommand: false,
    enableSorting: false,
    enableCellEdit: editable,
    width,
    minWidth,
    enableColumnResizing: true,
    enableFiltering: false,
    frozenColumnIndex: -1,
  });
}

export function globalGridUpdate(quantity) {
  updateCounter++;
  if (quantity === updateCounter) {
    eventBus.publish("generalGrid.plTable.clientRefresh");
    updateCounter = 0;
  }
}
