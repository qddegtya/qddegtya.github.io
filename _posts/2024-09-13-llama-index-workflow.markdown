---
layout: single
title: 工作流预览版介绍：一种新的使用 LlamaIndex 创建复杂 AI 应用的方式（译）
tags: llm 译文
category: llm
excerpt: "我们很高兴地介绍 LlamaIndex 的一个全新测试功能：工作流，这是一种用于协调日益复杂的 AI 应用中操作的机制，我们发现用户正在构建这样的应用。"
---

我们很高兴地介绍 LlamaIndex 的一个全新测试功能：工作流，这是一种用于协调日益复杂的 AI 应用中操作的机制，我们发现用户正在构建这样的应用。

随着大型语言模型（LLMs）的出现，一种趋势开始形成，现在已经成为事实上的标准：人工智能应用由不同组件实现的多个任务组成。市场上的开源框架努力通过提供易于使用的抽象来简化人工智能工程师的生活，这些抽象涵盖了从数据加载器、LLMs、向量数据库、重排序器到外部服务等基础组件。与此同时，所有这些框架也在寻求最佳的抽象来协调这些组件，研究对于人工智能开发者来说最直观和高效的实现方式，以便实现将复合人工智能系统紧密联系在一起的逻辑。

这两种潜在的编排模式是链和管道，它们都是相同的有向无环图（DAG）抽象的实现。我们在这方面进行了尝试[查询管道](https://www.llamaindex.ai/blog/introducing-query-pipelines-025dc2bb0537)在年初发布——它是一个声明式API，让你可以针对不同的用例（如QA、结构化提取和代理自动化）对你的数据执行简单到高级的查询工作流。但是，当我们尝试在其基础上构建并尝试添加循环以更好地支持更复杂的工作流时，我们注意到了几个问题，这让我们反思为什么DAG可能不适合代理景观，以及我们可以在框架中引入什么替代方案。

基于图的用户体验的局限性
------------

DAG（有向无环图）的一个基本特性就是它的“A”：它们是无环的，意味着没有循环。但在一个越来越具有代理性的世界里，AI应用逻辑中无法执行循环的能力是不可接受的。例如，如果一个组件提供了糟糕的结果，AI开发者应该有一种方法告诉系统自我修正并重试。

即使在DAG中没有添加循环和回环，查询管道也存在一些明显的问题：

*   当事情出错时，很难调试
*   它们隐藏了组件和模块是如何被执行的
*   我们的管道编排器变得越来越复杂，并且必须处理大量的不同边缘情况。
*   对于复杂的管道，它们很难阅读

一旦我们为查询管道添加了循环，这些关于图的开发者用户体验问题就被放大了。我们在诸如以下领域亲身体验了开发者的痛苦：

*   许多核心的编排逻辑，如`if-else`声明和`while`循环被烘焙到图的边缘。定义这些边缘变得繁琐和冗长。
*   处理可选值和默认值的边缘情况变得困难。对于我们作为一个框架来说，很难弄清楚一个参数是否会从上游节点传递过来。
*   定义具有循环的图对于构建代理的开发者来说并不总是感觉那么自然。代理封装了一个通用的LLM驱动实体，它可以接收观察并生成响应。在这里，图UX强制“代理”节点明确定义了传入边和传出边，迫使用户与其他节点定义冗长的通信模式。

我们问：图真的是我们唯一可以用来协调复合人工智能系统中组件的抽象吗？

从图表到EDA：转向事件驱动
--------------

复合人工智能系统可以通过LlamaIndex实现_工作流_。工作流通过一系列称为Python函数的集合来回分派事件_步骤_每个步骤都可以看作是系统的一个组成部分：一个用于处理查询，一个用于与LLM对话，一个用于从向量数据库加载数据，等等。每个步骤接收一个或多个事件进行处理，并且可以根据需要选择性地发送回事件，这些事件将被转发到其他组件。

转向事件驱动架构会导致设计上的根本转变。在许多图形实现中，图形遍历算法负责确定下一个应该运行哪个组件以及应该传递哪些数据。在事件驱动架构中，组件订阅了某些类型的事件，并且它最终负责根据接收到的数据决定要做什么。

在事件驱动系统中，像输入的可选性和默认值这样的概念在组件级别上得到了解决，大大简化了编排代码。

工作流程入门
------

为了帮助澄清这个想法，让我们来看一个例子。一个最小的LlamaIndex工作流程看起来像这样：

```python
    from llama_index.core.workflow import (
        StartEvent,
        StopEvent,
        Workflow,
        step,
    )

    from llama_index.llms.openai import OpenAI

    class OpenAIGenerator(Workflow):
        @step()
        async def generate(self, ev: StartEvent) -> StopEvent:
            query = ev.get("query")
            llm = OpenAI()
            response = await llm.acomplete(query)
            return StopEvent(result=str(response))

    w = OpenAIGenerator(timeout=10, verbose=False)
    result = await w.run(query="What's LlamaIndex?")
    print(result)
```

这个`generate`函数被标记为使用工作流步骤`@step`装饰器，并声明它想要接收哪些事件，以及它将使用适当的类型注释通过方法签名发送回哪些事件。为了运行工作流，我们创建了一个`OpenAIGenerator`类传递一些配置参数，如所需的超时时间，然后我们调用`run`方法。传递给任何关键字参数`run`将被打包进一个特殊事件类型`StartEvent`这将被转发到请求它的步骤（在这种情况下，只有`generate`步骤）。`generate`步骤返回一个特殊事件类型`StopEvent`这将指示工作流优雅地停止执行。一个`StopEvent`携带任何我们想要作为工作流结果返回给调用者的数据，在这种情况下是LLM响应。

### 工作流可以循环

在事件驱动架构中，循环与通信有关，而不是拓扑。任何步骤都可以通过制作和发送适当的事件来决定多次调用另一个步骤。让我们以一个自我校正循环为例（检查[笔记本](https://docs.llamaindex.ai/en/latest/examples/workflow/reflection/)（完整的代码）：

```python
    class ExtractionDone(Event):
        output: str
        passage: str


    class ValidationErrorEvent(Event):
        error: str
        wrong_output: str
        passage: str


    class ReflectionWorkflow(Workflow):
        @step()
        async def extract(
            self, ev: StartEvent | ValidationErrorEvent
        ) -> StopEvent | ExtractionDone:
            if isinstance(ev, StartEvent):
                passage = ev.get("passage")
                if not passage:
                    return StopEvent(result="Please provide some text in input")
                reflection_prompt = ""
            elif isinstance(ev, ValidationErrorEvent):
                passage = ev.passage
                reflection_prompt = REFLECTION_PROMPT.format(
                    wrong_answer=ev.wrong_output, error=ev.error
                )

            llm = Ollama(model="llama3", request_timeout=30)
            prompt = EXTRACTION_PROMPT.format(
                passage=passage, schema=CarCollection.schema_json()
            )
            if reflection_prompt:
                prompt += reflection_prompt

            output = await llm.acomplete(prompt)

            return ExtractionDone(output=str(output), passage=passage)

        @step()
        async def validate(
            self, ev: ExtractionDone
        ) -> StopEvent | ValidationErrorEvent:
            try:
                json.loads(ev.output)
            except Exception as e:
                print("Validation failed, retrying...")
                return ValidationErrorEvent(
                    error=str(e), wrong_output=ev.output, passage=ev.passage
                )

            return StopEvent(result=ev.output)

    w = ReflectionWorkflow(timeout=60, verbose=True)
    result = await w.run(
        passage="There are two cars available: a Fiat Panda with 45Hp and a Honda Civic with 330Hp."
    )
    print(result)
```

在这个例子中，`validate`步骤接收试探性模式提取的结果作为一个事件，并且可以通过返回一个来决定再次尝试`ValidationErrorEvent`这最终将被交付给`extract`步骤将执行另一次尝试。请注意，在这个例子中，如果这个提取/验证循环长时间提供糟糕的结果，工作流可能会超时，但另一种策略可能是在精确尝试次数后放弃，只是举个例子。

### 工作流保持状态

工作流在执行过程中保持一个全局状态，这个状态可以根据请求被共享和传播到其步骤。这种共享状态是实现为一个`Context`对象，可以被步骤用来在迭代之间存储数据，也可以作为不同步骤之间交流的另一种形式。让我们看一个更复杂的 RAG 示例的摘录，作为展示如何使用全局上下文的例子（请检查[笔记本](https://docs.llamaindex.ai/en/latest/examples/workflow/rag/)（完整代码）：

```python
    class RAGWorkflow(Workflow):
        @step(pass_context=True)
        async def ingest(self, ctx: Context, ev: StartEvent) -> Optional[StopEvent]:
            dataset_name = ev.get("dataset")
            _, documents = download_llama_dataset(dsname, "./data")
            ctx.data["INDEX"] = VectorStoreIndex.from_documents(documents=documents)
            return StopEvent(result=f"Indexed {len(documents)} documents.")

        ...
```

在这种情况下`ingest`步骤创建了一个索引，并希望在工作流执行期间将其提供给可能需要它的任何其他步骤。在LlamaIndex工作流中，典型的做法是声明该步骤需要一个全局上下文的实例。`@step(pass_context=True)`（这样做）并使用预定义的键将索引存储在上下文本身中，其他步骤稍后可能会访问这个键。

### 工作流程可以定制

除了工作流，我们还将发布一组预定义的工作流，以便最常用的用例可以通过一行代码实现。使用这些预定义的流程，用户仍然可能想要_轻微地_更改预定义的工作流程以引入一些自定义行为，而不必从头开始重写整个工作流程。假设您想要自定义一个RAG工作流程，并使用自定义的重新排名步骤，您所需要做的就是对一个假设的内置类进行子类化。 将预定义的工作流程更改为引入一些自定义行为，而无需从头开始重写整个工作流程。假设您想要自定义一个RAG工作流程，并使用自定义的重新排名步骤，您所需要做的就是对一个假设的内置类进行子类化。 更改预定义的工作流程，以引入一些自定义行为，而无需从头开始重写整个工作流程。比如说，您想要自定义一个RAG工作流程，并使用自定义的重新排名步骤，您所需要做的只是对一个假设的内置类进行子类化。`RAGWorkflow` 类并覆盖`rerank`像这样一步：

```python
    class MyWorkflow(RAGWorkflow):
        @step(pass_context=True)
        def rerank(
            self, ctx: Context, ev: Union[RetrieverEvent, StartEvent]
        ) -> Optional[QueryResult]:
            # my custom reranking logic here


    w = MyWorkflow(timeout=60, verbose=True)
    result = await w.run(query="Who is Paul Graham?")
```

### 可以调试工作流

随着应用程序逻辑的复杂性增加，您的工作流的复杂性也会增加，有时仅通过查看Python代码很难理解事件在执行期间的流动。为了便于理解复杂的工作流并支持工作流执行的调试，LlamaIndex提供了两个功能：

*   `draw_all_possible_flows`生成一个显示工作流中所有步骤以及事件可能流向的图片
*   `draw_most_recent_execution`产生了一个类似的图片，只显示在上一次工作流执行期间实际发送的事件

![](https://www.llamaindex.ai/_next/image?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2F7m9jw85w%2Fproduction%2F4db2cf184b7318891c997552e832638838e67620-1164x758.png%3Ffit%3Dmax%26auto%3Dformat&w=1200&q=75)

除此之外，可以通过调用执行工作流`run_step()`多次，直到所有步骤都完成。在每个`run_step`调用时，可以检查工作流，查看任何中间结果或调试日志。

为什么你应该在今天使用工作流
--------------

尽管LlamaIndex工作流还处于开发的早期阶段，但与查询管道相比，它们已经代表了向前迈进了一步，扩展了它们的功能并增加了更多的灵活性。除此之外，工作流还附带了一系列你通常会从一个成熟得多的软件中期待的特性：

*   完全异步支持流式传输
*   默认情况下提供支持的集成，通过一键式可观察性
*   逐步执行，便于调试
*   验证和可视化事件驱动的依赖关系
*   事件被实现为pydantic模型，以简化定制和新特性的进一步开发

资源
--

看看我们的[工作流程文档](https://docs.llamaindex.ai/en/latest/module_guides/workflow/)我们的[例子](https://github.com/run-llama/llama_index/tree/main/docs/docs/examples/workflow)包括：

*   [RAG](https://docs.llamaindex.ai/en/latest/examples/workflow/rag/)
*   [反映](https://docs.llamaindex.ai/en/latest/examples/workflow/reflection/)
*   [函数调用](https://docs.llamaindex.ai/en/latest/examples/workflow/function_calling_agent/)
*   [反应代理](https://docs.llamaindex.ai/en/latest/examples/workflow/react_agent/)

原文链接：[Introducing workflows beta: a new way to create complex AI applications with LlamaIndex](https://www.llamaindex.ai/blog/introducing-workflows-beta-a-new-way-to-create-complex-ai-applications-with-llamaindex)

本文使用 [🐝 A `C(Collect) -> T(Transform) -> P(Publish)` automation workflow for content creator.](https://github.com/qddegtya/r) 全自动采集 - 翻译 - 发布
