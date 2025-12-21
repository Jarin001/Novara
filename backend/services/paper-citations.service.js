const { getPaperRelations } = require("./paper-relations.base");

exports.getPaperCitations = async (params) => {
  return getPaperRelations({
    ...params,
    endpoint: "citations",
    paperKey: "citingPaper",
    totalCount: params.citationCount
  });
};
