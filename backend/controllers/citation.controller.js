const citationService = require('../services/citation.service');

const getPaperCitations = async (req, res) => {
    try {
        const { paperId } = req.params;

        // The Controller delegates the "work" to the Service
        const citations = await citationService.fetchAndFormatCitation(paperId);
        
        // Return the clean array of citations to the frontend
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