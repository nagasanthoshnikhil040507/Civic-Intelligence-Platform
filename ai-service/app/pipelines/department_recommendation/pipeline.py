from typing import Dict, Any
from app.utils.logger import logger

class DepartmentRecommendationPipeline:
    """
    Pipeline responsible for assigning predicted civic issues to the appropriate
    government department based on category classification.
    """

    def __init__(self) -> None:
        """
        Initializes the DepartmentRecommendationPipeline with predefined
        department mapping rules.
        """
        self.department_map = {
            "garbage": "Sanitation Department",
            "road_damage": "Roads & Buildings Department",
            "street_light": "Electrical Department",
            "water_leakage": "Water Supply Department"
        }

    def recommend_department(self, ai_result: Dict[str, Any]) -> str:
        """
        Determines the appropriate department based on the predicted category.

        Args:
            ai_result (Dict[str, Any]): The result dictionary from upstream pipelines,
                containing the 'categoryPrediction' field.

        Returns:
            str: The name of the recommended department, or "Unknown Department" if
                the category does not map to a known department.
        """
        category = ai_result.get("categoryPrediction", "")
        department = self.department_map.get(category, "Unknown Department")
        return department

    def run(self, ai_result: Dict[str, Any]) -> Dict[str, Any]:
        """
        Executes the department recommendation pipeline on the AI output.
        
        If the input 'processingStatus' is not 'completed', the input is returned
        unchanged without assigning a department.

        Args:
            ai_result (Dict[str, Any]): The output dictionary from the Priority
                Prediction Pipeline.

        Returns:
            Dict[str, Any]: The enriched dictionary appending the 'departmentRecommendation'
                field, preserving all existing fields.
        """
        # If upstream pipelines failed or skipped inference, do not assign a department
        if ai_result.get("processingStatus") != "completed":
            logger.info(
                f"Skipping department recommendation due to upstream status: "
                f"{ai_result.get('processingStatus')}"
            )
            return ai_result

        try:
            logger.info("Executing department recommendation pipeline...")
            
            department = self.recommend_department(ai_result)
            
            # Use copy() to preserve every existing field
            enriched_result = ai_result.copy()
            enriched_result["departmentRecommendation"] = department
            
            logger.info(
                f"Successfully mapped category '{ai_result.get('categoryPrediction')}' "
                f"to '{department}'."
            )
            
            return enriched_result
            
        except Exception as e:
            logger.error(f"Error during department recommendation: {e}")
            
            # Fail gracefully, preserving the original fields but marking failure
            failed_result = ai_result.copy()
            failed_result["processingStatus"] = "FAILED"
            failed_result["message"] = f"Department Recommendation Failed: {str(e)}"
            return failed_result
