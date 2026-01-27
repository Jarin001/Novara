const citationService = require('../services/citation.service');

const getPaperCitations = async (req, res) => {
    try {
        const { paperId } = req.params;

        
        const citations = await citationService.fetchAndFormatCitation(paperId);
        
        
        res.status(200).json({
            success: true,
            data: citations
        });
    } catch (error) {
        console.error("Controller Error:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to process citations. Please check the Paper ID."
        });
    }
};

module.exports = { getPaperCitations };