# 系统通知标记已读但刷新后仍显示未读状态 - 修复方案

## 问题描述

当用户在系统中将通知标记为已读后，刷新页面会发现通知仍显示为未读状态。这导致用户体验不佳，因为用户不能确定系统是否真正记录了已读状态。

## 问题分析

经过代码分析，我发现了以下关键问题：

1. 前端通过 `markMessageAsRead(messageId)` API（在 `src/api/message.js` 中定义）标记消息为已读，该函数调用的是 `/api/messages/${messageId}/read` PUT接口。

2. 后端 `MessageController` 接收这个请求并调用 `MessageService` 的 `markMessageAsRead(messageId, userId)` 方法（`MessageController.java` 第74-86行），该方法正确处理了全局消息的读取状态。

3. 但是在 `MessageServiceImpl` 中还存在另一个单参数的 `markMessageAsRead(messageId)` 重载方法（第450-455行），这个方法**没有处理全局消息**的读取状态，只更新了消息本身的 `is_read` 字段：

```java
@Override
public void markMessageAsRead(Long messageId) {
    Message message = new Message();
    message.setId(messageId);
    message.setIsRead(true);
    updateById(message);
}
```

4. 问题在于这个单参数方法没有处理全局消息的情况。对于全局消息，系统使用 `zf_message_read_status` 表来记录每个用户对消息的阅读状态，而不是直接更新 `zf_message` 表的 `is_read` 字段。

5. 所以当获取消息列表时（`getSystemMessages` 方法），系统会查询 `zf_message_read_status` 表获取已读状态，而如果某处错误地使用了单参数版本的方法，会导致全局消息的读取状态未被正确更新。

## 解决方案

修改 `MessageServiceImpl` 类中的单参数 `markMessageAsRead(messageId)` 方法，使其也能处理全局消息的读取状态。

```java
@Override
@Transactional
public void markMessageAsRead(Long messageId) {
    // 获取当前消息
    Message message = getById(messageId);
    if (message == null) {
        log.warn("标记消息为已读失败，消息不存在: messageId={}", messageId);
        return;
    }
    
    // 对于非全局消息，直接更新消息表
    if (message.getIsGlobal() == null || !message.getIsGlobal()) {
        message.setIsRead(true);
        message.setUpdateTime(LocalDateTime.now());
        updateById(message);
        return;
    }
    
    // 对于全局消息，记录错误日志，因为应该调用双参数版本的方法来处理全局消息
    // 全局消息需要知道是哪个用户已读，不能直接将消息标记为已读
    log.error("全局消息不能使用单参数markMessageAsRead方法标记已读，请使用双参数版本: messageId={}", messageId);
}
```

## 实施步骤

1. 修改 `../zufang-backend/src/main/java/com/zufang/service/impl/MessageServiceImpl.java` 文件中的单参数 `markMessageAsRead` 方法，按照上述代码实现。

2. 审查代码库中是否有直接调用单参数 `markMessageAsRead` 方法的地方，确保它们改为调用双参数版本，或者传入正确的用户ID。

3. 测试系统通知功能，确保标记已读后刷新页面仍能保持已读状态。

## 预期结果

实施此修复后，用户标记系统通知为已读的操作将被正确记录，即使在页面刷新后也能保持已读状态，提升用户体验。