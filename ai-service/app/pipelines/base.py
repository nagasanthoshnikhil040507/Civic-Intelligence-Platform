from abc import ABC, abstractmethod
from typing import Any

class BaseInferencePipeline(ABC):
    @abstractmethod
    def preprocess(self, data: Any) -> Any:
        pass

    @abstractmethod
    def infer(self, processed_data: Any) -> Any:
        pass

    @abstractmethod
    def postprocess(self, inference_result: Any) -> Any:
        pass

    def run(self, data: Any) -> Any:
        processed_data = self.preprocess(data)
        inference_result = self.infer(processed_data)
        final_result = self.postprocess(inference_result)
        return final_result
