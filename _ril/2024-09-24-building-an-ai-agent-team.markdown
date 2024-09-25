---
layout: single
title: 构建一支 AI Agent 团队
tags: llm 译文
category: llm
excerpt: "当我被介绍到 Relevance AI 时，我立刻就明白了。创建由 LLM 驱动的东西来自动化工作的灵活性吸引了我这个营销自动化书呆子。动态推理能力意味着我现在可以自动化那些总是放在太难篮子里的东西。部分原因是因为它是低代码的，部分原因是迭代周期可以多么容易。"
---

当我被介绍到 Relevance AI 时，我立刻就明白了。创建由 LLM 驱动的东西来自动化工作的灵活性吸引了我这个营销自动化书呆子。动态推理能力意味着我现在可以自动化那些总是放在太难篮子里的东西。部分原因是因为它是低代码的，部分原因是迭代周期可以多么容易。

在我上一份工作中，我们一直在研究一个由LLM驱动的电子邮件生成器的概念验证。由于产品和客户基础的性质，我们有很多需要的客户沟通，而且需要多种语言。这是必需的，但它阻止了团队像我们希望的那样做更多的战略性工作。我们有成千上万的以前的电子邮件可以用来训练LLM，我们已经知道翻译有多好，因为我们已经使用LLM将网站翻译成几种语言。我离开的时候我们才刚刚开始，但我可以立即看出，产生一致输出的迭代周期将比我最初想象的要慢得多。

所以，是的，我被说服了！

当我加入的时候，我们正准备发布[多智能体系统](https://site.relevanceai.com/blog/what-is-a-multi-agent-system-in-operations-a-game-changer-in-supply-chain-management)功能，这样你就可以建立一个相互联系的团队一起工作。 我立刻想到了建立一个内容团队，这个团队的结构是基于我有幸成为其中一员的非常成功的团队。

以下是这个非常真实的团队中角色的大致结构。

* 团队经理，负责诸如主题研究等工作，当然，还要确保团队的快乐和负责任。
* 新内容开发 - 谁做了详细的研究来完成一个简介，根据简介编写了内容，并创建了支持资产（在这种情况下是模板）。
* 现有内容优化 - 分析数据以确定帖子是否可以改进。进行研究，看看是否有新的内容可以添加到主题中。
* 编辑 - 帮助团队制作引人入胜的内容并发布内容。
* 翻译 - 进行研究以确定应该翻译的内容，然后进行翻译。

![](https://cdn.prod.website-files.com/637e7afd450ee24fb878e5b0/661f6578199f5223108cc5b6_https%253A%252F%252Fsubstack-post-media.s3.amazonaws.com%252Fpublic%252Fimages%252F57500e78-3c24-4ef1-9aee-c073a1142f9e_1398x726.jpeg)

我首先创建了新内容开发代理。这是一个基于给定主题创建非常详细内容概要的代理。它使用谷歌、领英和其他外部资源进行案头研究，确定一个角度，确定受众的意图，以及内容结构应该是什么样的。它会让我批准概要，如果我批准了，它就会写文章。梦想是让这个在自动驾驶仪上运行。

![](https://cdn.prod.website-files.com/637e7afd450ee24fb878e5b0/661f657775e7cdcd7688403d_https%253A%252F%252Fsubstack-post-media.s3.amazonaws.com%252Fpublic%252Fimages%252F7272134e-686b-4b45-b78d-bd4f4f8d8c03_699x159.jpeg)

输出还可以，但往往不一致。它通常需要我稍微推动一下，才能使简报和文章达到一个像样的形状。这很好，创造了一些不错的内容，但最终有点令人失望。

这让我停顿了一下，让我质疑复制一个人类团队是否真的可行。或者我最终只会花费我的时间去编辑提示并回应我的代理？

[代理架构](https://relevanceai.com/agents)：任务思考
-------------------------------------------

我有幸每天都能向周围所有了不起的人学习。通过潜移默化，我很清楚我应该如何看待这个问题，以获得更高质量的产出。_考虑任务，而不是角色。_

人工智能代理非常擅长做好一件事情。给他们一个明确的目标，清晰的指示，一套有限的特定能力（或者我们称之为人工智能工具），他们将完成重复性任务到一个非常高的标准。

因此，我不应该有一个新内容开发代理，而是应该将角色分解成不同的任务，并创建一个团队的代理一起工作。

![](https://cdn.prod.website-files.com/637e7afd450ee24fb878e5b0/661f657776491a691dadd753_https%253A%252F%252Fsubstack-post-media.s3.amazonaws.com%252Fpublic%252Fimages%252F3d89708a-5154-4ea4-be6a-eff171eb0fb2_699x364.png)

新内容开发经理 - 接收并解析请求，将其传递给相关代理，保持高质量标准，并发布内容。

研究员 - 给出了一个标准过程来遵循，什么是好的示例，以及一些工具来访问研究资源（即谷歌，领英，网站抓取）

内容写手 - 接受过良好写作训练，并有一些我们认为好的写作示例。配备了一个写作工具，这样我就可以测试不同的LLMs。例如，Claude以写作能力优于ChatGPT而闻名，所以我可以测试这一点。

模板创建者 - 训练有素，知道什么样的模板是好的，以及它应该是什么格式。

这种结构将使每个代理都有一个具体的目标，因此输出更加可靠。由于我可以将注意力集中在组成任务上，因此调试和优化过程也将变得更加容易。正如我所了解到的，代理还具有有限的上下文记忆，因此拥有广泛的职权通常会使得人工智能做出糟糕和不一致的选择。最终降低了质量，并且难以扩展。[模块化方法](https://site.relevanceai.com/blog/unveiling-the-power-of-multi-agent-system-in-operations)好多了。

使用多智能体辩论提高质量
------------

到目前为止，我主要关注多智能体系统的实用性。[上下文记忆挑战](https://site.relevanceai.com/blog/what-is-multi-agent-system-software-mass-in-customer-support)，降低复杂性，等等。但最近的研究表明，当人工智能代理一起工作时，会发生一些非常酷的事情[他们自己之间的辩论](https://site.relevanceai.com/blog/what-is-multi-agent-system-software-in-hr-a-comprehensive-guide).

[麻省理工学院和谷歌大脑的研究人员进行的一项研究](https://arxiv.org/pdf/2305.14325.pdf)进行了一系列实验来回答以下问题：

(1) 在多大程度上[多智能体辩论](https://site.relevanceai.com/blog/what-is-multi-agent-system-software-in-sales-strategy-a-comprehensive-guide)提高推理能力？

（2）多智能体辩论在多大程度上提高了[事实有效性](https://site.relevanceai.com/blog/what-is-multi-agent-system-software-in-marketing-and-how-it-improves-roi)？

他们发现推理能力有了显著提高。即使一个代理开始时给出了一个不正确的回答，其他代理的批评经常会导致通过辩论达到正确的答案。

![](https://cdn.prod.website-files.com/637e7afd450ee24fb878e5b0/661f6577e56a235a3d4fce0a_https%253A%252F%252Fsubstack-post-media.s3.amazonaws.com%252Fpublic%252Fimages%252F79c66ba1-5a7f-4012-9048-dca4feadb8e9_502x230.png)

随着代理们共同努力达成共识，事实的有效性也得到了提高，这种共识更加准确。

![](https://cdn.prod.website-files.com/637e7afd450ee24fb878e5b0/661f6578b1ebbd5c00b7bb50_https%253A%252F%252Fsubstack-post-media.s3.amazonaws.com%252Fpublic%252Fimages%252F94baeff2-0966-4c82-92f9-b705bb2968f5_1168x276.png)

因此，从理论上讲，要求新内容开发经理进行事实核查并与其他代理人进行辩论，应该会提高内容的质量。它在事实上更有可能准确，叙述应该会有所改进。这将允许大规模地提供出色的内容，并给我信心让团队自动运行。

多代理心态
-----

将事物拟人化是人类的天性，当涉及到人工智能代理时，这种倾向更加明显。说“考虑任务而非工作角色”是一件容易的事，但实际上却出奇地困难。如果你不这么做，情况会变得更加困难。对于副驾驶代理来说，这可能没问题，因为你可以纠正它们，但除非你能确保输出的一致性，否则你永远无法实现自动驾驶。

关键是将问题分解成具有离散目标和能力的离散任务。然后构建一个可以与其他代理协作以提高其输出的代理来执行每个任务。这确保任务可以始终如一地以高标准执行。同时也使得调试和优化变得非常容易。

我希望这能有所帮助。它彻底改变了我关于如何构建我的人工智能劳动力的精神模型。

原文链接：[Building an AI Agent Team](https://relevanceai.com/blog/building-an-ai-agent-team)

本文使用 [🐝 A `C(Collect) -> T(Transform) -> P(Publish)` automation workflow for content creator.](https://github.com/qddegtya/r) 全自动采集 - 翻译 - 发布
