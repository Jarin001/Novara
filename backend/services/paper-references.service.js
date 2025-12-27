const { getPaperRelations } = require("./paper-relations.base");

exports.getPaperReferences = async (params) => {
  return getPaperRelations({
    ...params,
    endpoint: "references",
    paperKey: "citedPaper",
    totalCount: params.referenceCount
  });
};
