// ==================== 全局变量和函数定义 ====================

// 全局变量
let records = [];
let selectedRecords = new Set();
let inactivityTimer;
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30分钟

// 记录分页相关变量
let currentPage = 1;
let recordsPerPage = 20;
let totalPages = 1;
let totalRecords = 0;

// 搜索状态变量
let currentSearchData = null;

// 系统日志相关变量
let currentLogPage = 1;
const logsPerPage = 20;
let totalLogPages = 1;
let totalLogs = 0;

// 事件统计相关变量
let currentEventName = '';
let eventStats = {
	giftAmount: 0,
	returnAmount: 0,
	totalAmount: 0,
	recordsCount: 0
};

// 自定义提示框函数
function showAlert(message, type = 'info') {
	// 对于成功操作，使用轻量级Toast提示
	if (type === 'success') {
		const toastElement = document.getElementById('successToast');
		const toastMessage = document.getElementById('successToastMessage');
		toastMessage.textContent = message;
		
		const toast = new bootstrap.Toast(toastElement, {
			autohide: true,
			delay: 3000
		});
		toast.show();
		return;
	}
	
	// 对于错误和确认信息，使用模态框
	const modalElement = document.getElementById('customAlertModal');
	const messageElement = document.getElementById('customAlertMessage');
	const titleElement = document.getElementById('customAlertLabel');
	
	messageElement.textContent = message;
	
	// 根据类型设置标题和样式
	if (type === 'error') {
		titleElement.textContent = '错误提示';
		titleElement.className = 'modal-title text-danger';
	} else if (type === 'confirm') {
		titleElement.textContent = '确认操作';
		titleElement.className = 'modal-title text-warning';
	} else {
		titleElement.textContent = '系统提示';
		titleElement.className = 'modal-title text-primary';
	}
	
	const modal = new bootstrap.Modal(modalElement);
	modal.show();
}

// 确认对话框函数
function showConfirm(message, confirmCallback, cancelCallback) {
	const modalElement = document.getElementById('customAlertModal');
	const messageElement = document.getElementById('customAlertMessage');
	const titleElement = document.getElementById('customAlertLabel');
	const footerElement = modalElement.querySelector('.modal-footer');
	
	messageElement.textContent = message;
	titleElement.textContent = '确认操作';
	titleElement.className = 'modal-title text-warning';
	
	// 保存原始按钮
	const originalFooter = footerElement.innerHTML;
	
	// 替换为确认和取消按钮
	footerElement.innerHTML = `
		<button type="button" class="btn btn-outline-secondary" id="cancelActionBtn">取消</button>
		<button type="button" class="btn btn-danger" id="confirmActionBtn">确定</button>
	`;
	
	const modal = new bootstrap.Modal(modalElement);
	modal.show();
	
	// 添加确认事件监听
	document.getElementById('confirmActionBtn').addEventListener('click', function() {
		modal.hide();
		// 恢复原始按钮
		setTimeout(() => {
			footerElement.innerHTML = originalFooter;
		}, 300);
		if (confirmCallback) confirmCallback();
	});
	
	// 添加取消事件监听
	document.getElementById('cancelActionBtn').addEventListener('click', function() {
		modal.hide();
		// 恢复原始按钮
		setTimeout(() => {
			footerElement.innerHTML = originalFooter;
		}, 300);
		if (cancelCallback) cancelCallback();
	});
	
	// 模态框隐藏时恢复原始按钮
	modalElement.addEventListener('hidden.bs.modal', function() {
		footerElement.innerHTML = originalFooter;
	});
}

// 加载用户信息
async function loadUserInfo() {
	try {
		const response = await fetch('/api/user_info');
		if (response.ok) {
			const userInfo = await response.json();
			document.getElementById('currentUserDisplay').textContent = userInfo.username;
		}
	} catch (error) {
		console.error('加载用户信息失败:', error);
	}
}

// 重置不活动计时器
function resetInactivityTimer() {
	if (inactivityTimer) {
		clearTimeout(inactivityTimer);
	}
	
	inactivityTimer = setTimeout(() => {
		showSessionTimeoutWarning();
	}, SESSION_TIMEOUT - 60000); // 提前1分钟警告
}

// 显示会话超时警告
function showSessionTimeoutWarning() {
	showConfirm('系统检测到您长时间未操作，会话即将在1分钟后过期。是否继续使用？', 
		function() {
			// 用户选择继续使用，重置计时器
			resetInactivityTimer();
			// 发送一个请求来更新会话活动时间
			fetch('/api/user_info').catch(() => {});
		},
		function() {
			// 用户选择不继续，立即退出
			logout();
		}
	);
}

// 显示加载状态
function showLoading() {
	document.getElementById('loadingSpinner').style.display = 'block';
	document.getElementById('recordsTableBody').innerHTML = '';
}

// 隐藏加载状态
function hideLoading() {
	document.getElementById('loadingSpinner').style.display = 'none';
}

// 加载记录
async function loadRecords() {
	showLoading();
	try {
		let url, method, body;
		
		if (currentSearchData) {
			// 如果是搜索状态，使用搜索API
			url = '/api/records/search';
			method = 'POST';
			
			// 确保使用最新的搜索条件
			const searchData = {
				record_type: document.getElementById('searchRecordType').value,
				name: document.getElementById('searchName').value,
				date: document.getElementById('searchDate').value,
				completion_status: document.getElementById('searchCompletionStatus').value,
				owner: document.getElementById('searchOwner').value,
				sort_method: document.getElementById('searchSortMethod').value
			};
			
			// 更新搜索条件
			currentSearchData = searchData;
			
			body = JSON.stringify({
				...searchData,
				page: currentPage,
				per_page: recordsPerPage
			});
		} else {
			// 如果是普通状态，使用普通API
			const sortMethod = document.getElementById('searchSortMethod').value;
			const params = new URLSearchParams({
				page: currentPage,
				per_page: recordsPerPage,
				sort_method: sortMethod
			});
			url = `/api/records?${params}`;
			method = 'GET';
			body = null;
		}
		
		const options = {
			method: method,
			headers: {
				'Content-Type': 'application/json',
			}
		};
		
		if (body) {
			options.body = body;
		}
		
		console.log(`正在加载记录，页码: ${currentPage}, 每页: ${recordsPerPage}, 模式: ${currentSearchData ? '搜索' : '普通'}`);
		
		const response = await fetch(url, options);
		if (response.ok) {
			const data = await response.json();
			records = data.records || [];
			totalRecords = data.total || 0;
			totalPages = data.total_pages || 1;
			
			document.getElementById('recordsCount').textContent = `${totalRecords} 条记录`;
			
			console.log(`加载成功，记录数: ${records.length}, 总记录数: ${totalRecords}, 总页数: ${totalPages}`);
			
			renderRecords();
			updateRecordsPagination();
			
			// 更新统计信息（基于整个数据库）
			updateStatistics();
			
			// 更新最后更新时间
			updateLastUpdateTime();
		} else {
			showAlert('加载记录失败', 'error');
		}
	} catch (error) {
		console.error('Error:', error);
		showAlert('加载记录失败，请检查网络连接', 'error');
	} finally {
		hideLoading();
	}
}

// 更新最后更新时间
function updateLastUpdateTime() {
	const now = new Date();
	const timeString = now.toLocaleTimeString('zh-CN', { 
		hour: '2-digit', 
		minute: '2-digit',
		second: '2-digit'
	});
	document.getElementById('lastUpdateTime').textContent = timeString;
}

// 渲染记录表格
function renderRecords() {
	const tbody = document.getElementById('recordsTableBody');
	tbody.innerHTML = '';

	// 更新记录数量显示
	document.getElementById('recordsCount').textContent = `${totalRecords} 条记录`;

	if (records.length === 0) {
		const tr = document.createElement('tr');
		tr.innerHTML = `<td colspan="13" class="text-center py-5 text-muted">
			<div class="empty-state">
				<i class="bi bi-inbox"></i>
				<p class="mt-2">暂无记录</p>
			</div>
		</td>`;
		tbody.appendChild(tr);
		updateRecordsPaginationInfo();
		updateRecordsPagination();
		return;
	}

	// 直接使用 records，它已经是当前页的数据
	records.forEach((record, index) => {
		const completionStatus = calculateCompletionStatus(record);
		const statusClass = getStatusClass(completionStatus);
		const ownerClass = getOwnerClass(record.owner || '郭宁');
		
		// 格式化日期显示
		const formatDate = (dateStr) => {
			if (!dateStr) return '-';
			if (typeof dateStr === 'string' && dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
				return dateStr;
			}
			try {
				const date = new Date(dateStr);
				return date.toISOString().split('T')[0];
			} catch (e) {
				return dateStr;
			}
		};

		const tr = document.createElement('tr');
		tr.className = 'fade-in-up';
		tr.style.animationDelay = `${index * 0.05}s`;
		tr.innerHTML = `
			<td><input type="checkbox" class="record-checkbox" value="${record.id}"></td>
			<td>${record.record_type}</td>
			<td><span class="fw-medium">${record.name}</span></td>
			<td><span class="fw-bold text-primary">${parseFloat(record.amount).toFixed(2)}</span></td>
			<td>${record.occasion}</td>
			<td>${formatDate(record.date)}</td>
			<td><span class="status-badge ${statusClass}">${completionStatus}</span></td>
			<td>${record.return_amount > 0 ? parseFloat(record.return_amount).toFixed(2) : '-'}</td>
			<td>${record.return_occasion || '-'}</td>
			<td>${formatDate(record.return_date)}</td>
			<td><span class="owner-badge ${ownerClass}">${record.owner || '郭宁'}</span></td>
			<td>${record.remark ? '<span class="text-muted" title="' + record.remark + '">📝</span>' : '-'}</td>
			<td>
				<div class="action-buttons">
					<button class="btn btn-sm btn-outline-primary btn-sm-compact edit-record-btn" data-id="${record.id}" title="编辑">
						<i class="bi bi-pencil"></i>
					</button>
					<button class="btn btn-sm btn-outline-danger btn-sm-compact delete-record-btn" data-id="${record.id}" title="删除">
						<i class="bi bi-trash"></i>
					</button>
				</div>
			</td>
		`;
		tbody.appendChild(tr);
	});

	updateRecordsPaginationInfo();
	updateRecordsPagination();

	// 添加复选框事件监听
	document.querySelectorAll('.record-checkbox').forEach(checkbox => {
		checkbox.addEventListener('change', function() {
			if (this.checked) {
				selectedRecords.add(parseInt(this.value));
			} else {
				selectedRecords.delete(parseInt(this.value));
			}
			updateSelectAllState();
		});
	});
	
	// 添加编辑和删除按钮事件监听
	document.querySelectorAll('.edit-record-btn').forEach(button => {
		button.addEventListener('click', function() {
			const recordId = parseInt(this.getAttribute('data-id'));
			editRecord(recordId);
		});
	});
	
	document.querySelectorAll('.delete-record-btn').forEach(button => {
		button.addEventListener('click', function() {
			const recordId = parseInt(this.getAttribute('data-id'));
			deleteRecord(recordId);
		});
	});
	
	updateSelectAllState();
}

// 计算完成状态
function calculateCompletionStatus(record) {
	const hasBasicInfo = record.name && record.amount > 0 && record.occasion && record.date;
	const hasReturnInfo = record.return_amount > 0 && record.return_occasion && record.return_date;

	if (record.record_type === "受礼记录") {
		if (hasBasicInfo && hasReturnInfo) return "已完成";
		if (hasBasicInfo) return "仅受礼";
		return "未完成";
	} else {
		if (hasBasicInfo && hasReturnInfo) return "已完成";
		if (hasBasicInfo) return "仅随礼";
		return "未完成";
	}
}

// 获取状态样式类
function getStatusClass(status) {
	switch(status) {
		case '已完成': return 'status-completed';
		case '仅受礼': return 'status-received';
		case '仅随礼': return 'status-given';
		default: return 'status-pending';
	}
}

// 获取所属人样式类
function getOwnerClass(owner) {
	switch(owner) {
		case '郭宁': return 'owner-userA';
		case '李佳慧': return 'owner-userB';
		default: return 'owner-userA';
	}
}

// 更新统计信息 - 基于整个数据库
async function updateStatistics() {
	try {
		console.log("正在更新统计信息...");
		const response = await fetch('/api/statistics');
		if (response.ok) {
			const data = await response.json();
			console.log("统计数据:", data);
			
			// 确保所有值都是数字
			const formatNumber = (value) => {
				if (value === undefined || value === null) return 0;
				if (typeof value === 'string') return parseFloat(value) || 0;
				if (typeof value === 'number') return value;
				return Number(value) || 0;
			};
			
			// 格式化金额显示
			const formatCurrency = (value) => {
				const num = formatNumber(value);
				return num.toFixed(2);
			};
			
			// 更新数量显示
			document.getElementById('totalCount').textContent = formatNumber(data.total_count);
			document.getElementById('giftCountA').textContent = formatNumber(data.gift_count_a);
			document.getElementById('returnCountA').textContent = formatNumber(data.return_count_a);
			document.getElementById('giftCountB').textContent = formatNumber(data.gift_count_b);
			document.getElementById('returnCountB').textContent = formatNumber(data.return_count_b);
			document.getElementById('completedCount').textContent = formatNumber(data.completed_count);
			
			// 更新金额显示
			document.getElementById('giftAmountA').textContent = formatCurrency(data.total_gift_amount_a) + ' 元';
			document.getElementById('returnAmountA').textContent = formatCurrency(data.total_return_amount_a) + ' 元';
			document.getElementById('giftAmountB').textContent = formatCurrency(data.total_gift_amount_b) + ' 元';
			document.getElementById('returnAmountB').textContent = formatCurrency(data.total_return_amount_b) + ' 元';
			
			console.log("统计信息更新完成");
		} else {
			console.error('获取统计数据失败，状态码:', response.status);
		}
	} catch (error) {
		console.error('更新统计信息时发生错误:', error);
	}
}

// 搜索记录
async function searchRecords() {
	showLoading();
	currentPage = 1; // 搜索时重置到第一页
	
	const searchData = {
		record_type: document.getElementById('searchRecordType').value,
		name: document.getElementById('searchName').value,
		date: document.getElementById('searchDate').value,
		completion_status: document.getElementById('searchCompletionStatus').value,
		owner: document.getElementById('searchOwner').value,
		sort_method: document.getElementById('searchSortMethod').value
	};

	// 保存搜索条件
	currentSearchData = searchData;

	try {
		// 发送搜索请求，包含分页参数
		const response = await fetch('/api/records/search', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				...searchData,
				page: currentPage,
				per_page: recordsPerPage
			})
		});

		if (response.ok) {
			const data = await response.json();
			records = data.records || [];
			totalRecords = data.total || 0;
			totalPages = data.total_pages || 1;
			
			renderRecords();
			updateStatistics(); // 搜索后也更新统计
			updateLastUpdateTime();
		} else {
			showAlert('搜索失败', 'error');
		}
	} catch (error) {
		console.error('Error:', error);
		showAlert('搜索失败，请检查网络连接', 'error');
	} finally {
		hideLoading();
	}
}

// 修改记录分页信息显示
function updateRecordsPaginationInfo() {
	const startItem = (currentPage - 1) * recordsPerPage + 1;
	const endItem = Math.min(currentPage * recordsPerPage, totalRecords);
	document.getElementById('recordsPaginationInfo').textContent = 
		`显示 ${startItem}-${endItem} 条，共 ${totalRecords} 条记录`;
}

// 更新记录分页控件
function updateRecordsPagination() {
	const pagination = document.getElementById('recordsPagination');
	pagination.innerHTML = '';

	totalPages = Math.ceil(totalRecords / recordsPerPage);

	// 首页按钮
	const firstLi = document.createElement('li');
	firstLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
	firstLi.innerHTML = `
		<a class="page-link" href="#" aria-label="首页" data-page="1">
			<i class="bi bi-chevron-double-left"></i>
		</a>
	`;
	pagination.appendChild(firstLi);

	// 上一页按钮
	const prevLi = document.createElement('li');
	prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
	prevLi.innerHTML = `
		<a class="page-link" href="#" aria-label="上一页" data-page="${currentPage - 1}">
			<i class="bi bi-chevron-left"></i>
		</a>
	`;
	pagination.appendChild(prevLi);

	// 页码按钮
	const maxVisiblePages = 5;
	let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
	let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
	
	if (endPage - startPage + 1 < maxVisiblePages) {
		startPage = Math.max(1, endPage - maxVisiblePages + 1);
	}

	if (startPage > 1) {
		const pageLi = document.createElement('li');
		pageLi.className = 'page-item';
		pageLi.innerHTML = `<a class="page-link" href="#" data-page="1">1</a>`;
		pagination.appendChild(pageLi);
		
		if (startPage > 2) {
			const ellipsisLi = document.createElement('li');
			ellipsisLi.className = 'page-item disabled';
			ellipsisLi.innerHTML = `<span class="page-link">...</span>`;
			pagination.appendChild(ellipsisLi);
		}
	}

	for (let i = startPage; i <= endPage; i++) {
		const pageLi = document.createElement('li');
		pageLi.className = `page-item ${i === currentPage ? 'active' : ''}`;
		pageLi.innerHTML = `<a class="page-link" href="#" data-page="${i}">${i}</a>`;
		pagination.appendChild(pageLi);
	}

	if (endPage < totalPages) {
		if (endPage < totalPages - 1) {
			const ellipsisLi = document.createElement('li');
			ellipsisLi.className = 'page-item disabled';
			ellipsisLi.innerHTML = `<span class="page-link">...</span>`;
			pagination.appendChild(ellipsisLi);
		}
		
		const pageLi = document.createElement('li');
		pageLi.className = 'page-item';
		pageLi.innerHTML = `<a class="page-link" href="#" data-page="${totalPages}">${totalPages}</a>`;
		pagination.appendChild(pageLi);
	}

	// 下一页按钮
	const nextLi = document.createElement('li');
	nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
	nextLi.innerHTML = `
		<a class="page-link" href="#" aria-label="下一页" data-page="${currentPage + 1}">
			<i class="bi bi-chevron-right"></i>
		</a>
	`;
	pagination.appendChild(nextLi);

	// 尾页按钮
	const lastLi = document.createElement('li');
	lastLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
	lastLi.innerHTML = `
		<a class="page-link" href="#" aria-label="尾页" data-page="${totalPages}">
			<i class="bi bi-chevron-double-right"></i>
		</a>
	`;
	pagination.appendChild(lastLi);

	// 更新跳转输入框
	updatePageJumpInput();

	// 添加分页点击事件
	document.querySelectorAll('#recordsPagination .page-link').forEach(link => {
		link.addEventListener('click', function(e) {
			e.preventDefault();
			const page = parseInt(this.getAttribute('data-page'));
			if (page && !isNaN(page)) {
				changePage(page);
			}
		});
	});
}

// 更新页码跳转输入框
function updatePageJumpInput() {
	const pageJumpInput = document.getElementById('pageJumpInput');
	pageJumpInput.value = currentPage;
	pageJumpInput.max = totalPages;
	pageJumpInput.min = 1;
}

// 跳转到指定页面
function jumpToPage() {
	const pageJumpInput = document.getElementById('pageJumpInput');
	const targetPage = parseInt(pageJumpInput.value);
	
	if (isNaN(targetPage) || targetPage < 1 || targetPage > totalPages) {
		showAlert(`请输入有效的页码 (1-${totalPages})`, 'error');
		pageJumpInput.value = currentPage;
		return;
	}
	
	changePage(targetPage);
}

// 切换记录页码
function changePage(page) {
	if (page < 1 || page > totalPages) return;
	currentPage = page;
	console.log(`切换到第 ${currentPage} 页`);
	loadRecords();  // 直接调用 loadRecords，它会根据当前状态决定如何加载
	updatePageJumpInput();
}

// 打开添加模态框
function openAddModal() {
	document.getElementById('recordModalTitle').textContent = '添加记录';
	document.getElementById('recordForm').reset();
	document.getElementById('recordId').value = '';
	
	// 设置默认日期为今天
	const today = new Date().toISOString().split('T')[0];
	document.getElementById('date').value = today;
	
	const modal = new bootstrap.Modal(document.getElementById('addRecordModal'));
	modal.show();
	
	// 聚焦到姓名输入框
	setTimeout(() => {
		document.getElementById('name').focus();
	}, 500);
}

// 编辑记录
function editRecord(id) {
	const record = records.find(r => r.id === id);
	if (!record) return;

	document.getElementById('recordModalTitle').textContent = '编辑记录';
	document.getElementById('recordId').value = record.id;
	document.getElementById('recordType').value = record.record_type;
	document.getElementById('owner').value = record.owner || '郭宁';
	document.getElementById('name').value = record.name;
	document.getElementById('amount').value = record.amount;
	document.getElementById('occasion').value = record.occasion;
	document.getElementById('date').value = record.date;
	document.getElementById('returnAmount').value = record.return_amount || 0;
	document.getElementById('returnOccasion').value = record.return_occasion || '';
	document.getElementById('returnDate').value = record.return_date || '';
	document.getElementById('remark').value = record.remark || '';

	const modal = new bootstrap.Modal(document.getElementById('addRecordModal'));
	modal.show();
	
	// 聚焦到姓名输入框
	setTimeout(() => {
		document.getElementById('name').focus();
	}, 500);
}

// 保存记录
async function saveRecord() {
	const formData = {
		record_type: document.getElementById('recordType').value,
		owner: document.getElementById('owner').value,
		name: document.getElementById('name').value,
		amount: document.getElementById('amount').value,
		occasion: document.getElementById('occasion').value,
		date: document.getElementById('date').value,
		return_amount: document.getElementById('returnAmount').value || 0,
		return_occasion: document.getElementById('returnOccasion').value,
		return_date: document.getElementById('returnDate').value,
		remark: document.getElementById('remark').value
	};

	// 客户端验证
	if (!formData.name.trim()) {
		showAlert('姓名不能为空', 'error');
		document.getElementById('name').focus();
		return;
	}
	if (!formData.amount || parseFloat(formData.amount) <= 0) {
		showAlert('金额必须大于0', 'error');
		document.getElementById('amount').focus();
		return;
	}
	if (!formData.occasion.trim()) {
		showAlert('事件不能为空', 'error');
		document.getElementById('occasion').focus();
		return;
	}
	if (!formData.date) {
		showAlert('日期不能为空', 'error');
		document.getElementById('date').focus();
		return;
	}

	const recordId = document.getElementById('recordId').value;
	const url = recordId ? `/api/records/${recordId}` : '/api/records';
	const method = recordId ? 'PUT' : 'POST';

	const saveBtn = document.getElementById('saveRecordBtn');
	const originalText = saveBtn.innerHTML;
	saveBtn.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>保存中...';
	saveBtn.disabled = true;

	try {
		const response = await fetch(url, {
			method: method,
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(formData)
		});

		const result = await response.json();
		if (result.success) {
			const modal = bootstrap.Modal.getInstance(document.getElementById('addRecordModal'));
			modal.hide();
			loadRecords();
			showAlert(recordId ? '记录更新成功！' : '记录添加成功！', 'success');
		} else {
			// 处理重复错误
			if (result.duplicate) {
				showAlert('该记录已存在，请勿重复添加！', 'error');
			} else {
				showAlert(result.message || '保存失败', 'error');
			}
		}
	} catch (error) {
		console.error('Error:', error);
		showAlert('网络错误，保存失败', 'error');
	} finally {
		saveBtn.innerHTML = originalText;
		saveBtn.disabled = false;
	}
}

// 删除记录
function deleteRecord(id) {
	showConfirm('确定要删除这条记录吗？此操作不可恢复！', function() {
		deleteRecordConfirmed(id);
	});
}

async function deleteRecordConfirmed(id) {
	try {
		const response = await fetch(`/api/records/${id}`, {
			method: 'DELETE'
		});

		const result = await response.json();
		if (result.success) {
			loadRecords();
			showAlert('记录删除成功！', 'success');
		} else {
			showAlert(result.message || '删除失败', 'error');
		}
	} catch (error) {
		console.error('Error:', error);
		showAlert('删除失败，请检查网络连接', 'error');
	}
}

// 删除选中的记录
function deleteSelectedRecords() {
	if (selectedRecords.size === 0) {
		showAlert('请先选择要删除的记录', 'error');
		return;
	}

	showConfirm(`确定要删除选中的 ${selectedRecords.size} 条记录吗？此操作不可恢复！`, function() {
		deleteSelectedRecordsConfirmed();
	});
}

async function deleteSelectedRecordsConfirmed() {
	const deletePromises = Array.from(selectedRecords).map(id => 
		fetch(`/api/records/${id}`, { method: 'DELETE' })
	);

	try {
		await Promise.all(deletePromises);
		selectedRecords.clear();
		loadRecords();
		showAlert(`成功删除 ${deletePromises.length} 条记录！`, 'success');
	} catch (error) {
		console.error('Error:', error);
		showAlert('删除失败，请检查网络连接', 'error');
	}
}

// 全选/取消全选
function toggleSelectAll() {
	const checkAll = document.getElementById('selectAll').checked;
	document.querySelectorAll('.record-checkbox').forEach(checkbox => {
		checkbox.checked = checkAll;
		if (checkAll) {
			selectedRecords.add(parseInt(checkbox.value));
		} else {
			selectedRecords.delete(parseInt(checkbox.value));
		}
	});
}

// 更新全选复选框状态
function updateSelectAllState() {
	const checkboxes = document.querySelectorAll('.record-checkbox');
	const allChecked = checkboxes.length > 0 && Array.from(checkboxes).every(cb => cb.checked);
	document.getElementById('selectAll').checked = allChecked;
	document.getElementById('selectAll').indeterminate = !allChecked && selectedRecords.size > 0;
}

// 打开修改密码模态框
function openChangePasswordModal() {
	document.getElementById('passwordForm').reset();
	const modal = new bootstrap.Modal(document.getElementById('changePasswordModal'));
	modal.show();
	
	setTimeout(() => {
		document.getElementById('oldPassword').focus();
	}, 500);
}

// 修改密码
async function changePassword() {
	const oldPassword = document.getElementById('oldPassword').value;
	const newPassword = document.getElementById('newPassword').value;
	const confirmPassword = document.getElementById('confirmPassword').value;

	if (!oldPassword) {
		showAlert('请输入原密码', 'error');
		document.getElementById('oldPassword').focus();
		return;
	}

	if (!newPassword || newPassword.length < 6) {
		showAlert('新密码长度至少6位', 'error');
		document.getElementById('newPassword').focus();
		return;
	}

	if (newPassword !== confirmPassword) {
		showAlert('两次输入的新密码不一致', 'error');
		document.getElementById('confirmPassword').focus();
		return;
	}

	const saveBtn = document.getElementById('savePasswordBtn');
	const originalText = saveBtn.innerHTML;
	saveBtn.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>修改中...';
	saveBtn.disabled = true;

	try {
		const response = await fetch('/api/change_password', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				old_password: oldPassword,
				new_password: newPassword
			})
		});

		const result = await response.json();
		if (result.success) {
			const modal = bootstrap.Modal.getInstance(document.getElementById('changePasswordModal'));
			modal.hide();
			showAlert('密码修改成功！', 'success');
		} else {
			showAlert(result.message || '密码修改失败', 'error');
		}
	} catch (error) {
		console.error('Error:', error);
		showAlert('密码修改失败，请检查网络连接', 'error');
	} finally {
		saveBtn.innerHTML = originalText;
		saveBtn.disabled = false;
	}
}

// ===================== 修改安全问题功能 =====================

// 打开修改安全问题模态框
function openChangeSecurityQuestionModal() {
	document.getElementById('securityQuestionForm').reset();
	const modal = new bootstrap.Modal(document.getElementById('changeSecurityQuestionModal'));
	modal.show();
	
	setTimeout(() => {
		document.getElementById('currentPassword').focus();
	}, 500);
}

// 修改安全问题
async function changeSecurityQuestion() {
	const currentPassword = document.getElementById('currentPassword').value;
	const newSecurityQuestion = document.getElementById('newSecurityQuestion').value.trim();
	const newSecurityAnswer = document.getElementById('newSecurityAnswer').value.trim();

	if (!currentPassword) {
		showAlert('请输入当前密码', 'error');
		document.getElementById('currentPassword').focus();
		return;
	}

	if (!newSecurityQuestion) {
		showAlert('请输入新安全问题', 'error');
		document.getElementById('newSecurityQuestion').focus();
		return;
	}

	if (!newSecurityAnswer) {
		showAlert('请输入新安全答案', 'error');
		document.getElementById('newSecurityAnswer').focus();
		return;
	}

	const saveBtn = document.getElementById('saveSecurityQuestionBtn');
	const originalText = saveBtn.innerHTML;
	saveBtn.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>修改中...';
	saveBtn.disabled = true;

	try {
		const response = await fetch('/api/change_security_question', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				password: currentPassword,
				new_question: newSecurityQuestion,
				new_answer: newSecurityAnswer
			})
		});

		const result = await response.json();
		if (result.success) {
			const modal = bootstrap.Modal.getInstance(document.getElementById('changeSecurityQuestionModal'));
			modal.hide();
			showAlert('安全问题修改成功！', 'success');
		} else {
			showAlert(result.message || '安全问题修改失败', 'error');
		}
	} catch (error) {
		console.error('Error:', error);
		showAlert('安全问题修改失败，请检查网络连接', 'error');
	} finally {
		saveBtn.innerHTML = originalText;
		saveBtn.disabled = false;
	}
}

// ===================== 事件金额统计功能 =====================

// 打开事件统计模态框
function openEventStatsModal() {
	document.getElementById('eventName').value = '';
	document.getElementById('eventStatsResult').style.display = 'none';
	document.getElementById('showOnDashboard').style.display = 'none';
	refreshEventList();
	
	const modal = new bootstrap.Modal(document.getElementById('eventStatsModal'));
	modal.show();
	
	setTimeout(() => {
		document.getElementById('eventName').focus();
	}, 500);
}

// 刷新事件列表
function refreshEventList() {
	const eventList = document.getElementById('eventList');
	eventList.innerHTML = '';
	
	// 收集所有事件名称（包括受礼记录的事件和随礼记录的回礼事件）
	const events = new Set();
	records.forEach(record => {
		if (record.occasion) events.add(record.occasion);
		if (record.return_occasion) events.add(record.return_occasion);
	});
	
	// 按字母顺序排序
	const sortedEvents = Array.from(events).sort();
	
	// 添加到datalist
	sortedEvents.forEach(event => {
		const option = document.createElement('option');
		option.value = event;
		eventList.appendChild(option);
	});
}

// 计算事件统计
async function calculateEventStats() {
	const eventName = document.getElementById('eventName').value.trim();
	
	if (!eventName) {
		showAlert('请输入事件名称', 'error');
		document.getElementById('eventName').focus();
		return;
	}
	
	// 重置统计结果
	eventStats = {
		giftAmount: 0,
		returnAmount: 0,
		totalAmount: 0,
		recordsCount: 0
	};
	
	// 显示加载状态
	const calculateBtn = document.getElementById('calculateEventStats');
	const originalText = calculateBtn.innerHTML;
	calculateBtn.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>计算中...';
	calculateBtn.disabled = true;
	
	try {
		// 从后端获取事件统计
		const response = await fetch(`/api/event_statistics?event_name=${encodeURIComponent(eventName)}`);
		const data = await response.json();
		
		if (data.success) {
			eventStats = {
				giftAmount: data.gift_amount || 0,
				returnAmount: data.return_amount || 0,
				totalAmount: data.total_amount || 0,
				recordsCount: data.records_count || 0
			};
			
			// 更新模态框中的显示
			document.getElementById('modalEventGiftAmount').textContent = eventStats.giftAmount.toFixed(2);
			document.getElementById('modalEventReturnAmount').textContent = eventStats.returnAmount.toFixed(2);
			document.getElementById('modalEventTotalAmount').textContent = eventStats.totalAmount.toFixed(2);
			
			// 显示相关记录表格
			renderEventRecordsTable(data.related_records || []);
			
			// 显示结果区域
			document.getElementById('eventStatsResult').style.display = 'block';
			document.getElementById('showOnDashboard').style.display = 'inline-block';
			
			showAlert(`已计算"${eventName}"事件相关的金额统计`, 'success');
		} else {
			showAlert(data.message || '计算失败', 'error');
		}
	} catch (error) {
		console.error('Error:', error);
		showAlert('计算失败，请检查网络连接', 'error');
	} finally {
		calculateBtn.innerHTML = originalText;
		calculateBtn.disabled = false;
	}
}

// 渲染事件相关记录表格
function renderEventRecordsTable(relatedRecords) {
	const tbody = document.getElementById('eventRecordsTableBody');
	tbody.innerHTML = '';
	
	if (relatedRecords.length === 0) {
		const tr = document.createElement('tr');
		tr.innerHTML = `<td colspan="8" class="text-center py-4 text-muted">
			<div class="empty-state">
				<i class="bi bi-inbox"></i>
				<p class="mt-2">暂无相关记录</p>
			</div>
		</td>`;
		tbody.appendChild(tr);
		return;
	}
	
	relatedRecords.forEach(record => {
		const isGiftRecord = record.record_type === "受礼记录";
		const tr = document.createElement('tr');
		tr.innerHTML = `
			<td>${record.record_type}</td>
			<td>${record.name}</td>
			<td>${parseFloat(record.amount).toFixed(2)}</td>
			<td>${isGiftRecord ? record.occasion : record.return_occasion}</td>
			<td>${record.return_amount > 0 ? parseFloat(record.return_amount).toFixed(2) : '-'}</td>
			<td>${record.return_occasion || '-'}</td>
			<td>${record.date}</td>
			<td>${record.owner || '郭宁'}</td>
		`;
		tbody.appendChild(tr);
	});
}

// 在仪表板显示事件统计
function showEventStatsOnDashboard() {
	const eventName = document.getElementById('eventName').value.trim();
	
	if (!eventName) {
		showAlert('请先计算事件统计', 'error');
		return;
	}
	
	// 更新当前事件名称
	currentEventName = eventName;
	
	// 更新仪表板显示
	document.getElementById('currentEventName').textContent = eventName;
	document.getElementById('eventGiftAmount').textContent = eventStats.giftAmount.toFixed(2);
	document.getElementById('eventReturnAmount').textContent = eventStats.returnAmount.toFixed(2);
	document.getElementById('eventTotalAmount').textContent = eventStats.totalAmount.toFixed(2);
	document.getElementById('eventRecordsCount').textContent = eventStats.recordsCount;
	
	// 显示事件统计卡片
	document.getElementById('eventStatsRow').style.display = 'block';
	
	// 关闭模态框
	const modal = bootstrap.Modal.getInstance(document.getElementById('eventStatsModal'));
	modal.hide();
	
	showAlert(`"${eventName}"事件统计已显示在仪表板上`, 'success');
}

// 关闭事件统计显示
function closeEventStats() {
	document.getElementById('eventStatsRow').style.display = 'none';
	currentEventName = '';
	showAlert('事件统计显示已关闭', 'info');
}

// ===================== 回礼记录统计功能 =====================

// 打开回礼记录统计模态框
function openReturnRecordsStatsModal() {
	// 设置默认日期范围（最近30天）
	const endDate = new Date();
	const startDate = new Date();
	startDate.setDate(endDate.getDate() - 30);
	
	document.getElementById('returnStartDate').value = startDate.toISOString().split('T')[0];
	document.getElementById('returnEndDate').value = endDate.toISOString().split('T')[0];
	document.getElementById('returnOwner').value = '全部';
	document.getElementById('returnStatsResult').style.display = 'none';
	document.getElementById('exportReturnStats').style.display = 'none';
	
	const modal = new bootstrap.Modal(document.getElementById('returnRecordsStatsModal'));
	modal.show();
}

// 计算回礼记录统计
async function calculateReturnRecordsStats() {
	const startDate = document.getElementById('returnStartDate').value;
	const endDate = document.getElementById('returnEndDate').value;
	const owner = document.getElementById('returnOwner').value;
	
	if (!startDate || !endDate) {
		showAlert('请选择开始日期和结束日期', 'error');
		return;
	}
	
	if (new Date(startDate) > new Date(endDate)) {
		showAlert('开始日期不能晚于结束日期', 'error');
		return;
	}
	
	// 显示加载状态
	const calculateBtn = document.getElementById('calculateReturnStats');
	const originalText = calculateBtn.innerHTML;
	calculateBtn.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>查询中...';
	calculateBtn.disabled = true;
	
	try {
		// 构建查询参数
		const params = new URLSearchParams({
			start_date: startDate,
			end_date: endDate,
			owner: owner
		});
		
		// 发送请求到后端API
		const response = await fetch(`/api/return_records/statistics?${params}`);
		
		if (response.ok) {
			const data = await response.json();
			
			if (data.success) {
				// 更新统计结果
				document.getElementById('returnRecordsCount').textContent = data.records_count;
				document.getElementById('returnTotalAmount').textContent = data.total_amount.toFixed(2);
				
				// 渲染记录表格
				renderReturnRecordsTable(data.records || []);
				
				// 显示结果区域
				document.getElementById('returnStatsResult').style.display = 'block';
				document.getElementById('exportReturnStats').style.display = 'inline-block';
				
				showAlert(`查询完成，共找到 ${data.records_count} 条记录`, 'success');
			} else {
				showAlert(data.message || '查询失败', 'error');
			}
		} else {
			showAlert('查询失败，请检查网络连接', 'error');
		}
	} catch (error) {
		console.error('查询回礼记录统计错误:', error);
		showAlert('查询失败，请检查网络连接', 'error');
	} finally {
		calculateBtn.innerHTML = originalText;
		calculateBtn.disabled = false;
	}
}

// 渲染回礼记录表格
function renderReturnRecordsTable(records) {
	const tbody = document.getElementById('returnRecordsTableBody');
	tbody.innerHTML = '';
	
	if (records.length === 0) {
		const tr = document.createElement('tr');
		tr.innerHTML = `<td colspan="9" class="text-center py-4 text-muted">
			<div class="empty-state">
				<i class="bi bi-inbox"></i>
				<p class="mt-2">暂无回礼记录</p>
			</div>
		</td>`;
		tbody.appendChild(tr);
		return;
	}
	
	// 按记录日期降序排列
	records.sort((a, b) => new Date(b.date) - new Date(a.date));
	
	records.forEach(record => {
		// 格式化日期
		const formatDate = (dateStr) => {
			if (!dateStr) return '-';
			try {
				const date = new Date(dateStr);
				return date.toISOString().split('T')[0];
			} catch (e) {
				return dateStr;
			}
		};
		
		// 计算支出金额
		// 对于随礼记录：支出金额 = 金额
		// 对于受礼记录：支出金额 = 回礼金额
		const expenseAmount = record.record_type === '随礼记录' ? 
			parseFloat(record.amount) : 
			parseFloat(record.return_amount || 0);
		
		const tr = document.createElement('tr');
		tr.innerHTML = `
			<td>${record.record_type}</td>
			<td>${record.name}</td>
			<td>${record.occasion}</td>
			<td>${parseFloat(record.amount).toFixed(2)}</td>
			<td>${record.return_occasion || '-'}</td>
			<td>${record.return_amount > 0 ? parseFloat(record.return_amount).toFixed(2) : '-'}</td>
			<td>${formatDate(record.return_date)}</td>
			<td>${record.owner || '郭宁'}</td>
			<td>${formatDate(record.date)}</td>
		`;
		tbody.appendChild(tr);
	});
}

// 导出回礼统计结果
function exportReturnStats() {
	const startDate = document.getElementById('returnStartDate').value;
	const endDate = document.getElementById('returnEndDate').value;
	const owner = document.getElementById('returnOwner').value;
	
	if (!startDate || !endDate) {
		showAlert('请先查询数据', 'error');
		return;
	}
	
	// 构建导出URL
	const params = new URLSearchParams({
		start_date: startDate,
		end_date: endDate,
		owner: owner,
		export: 'true'
	});
	
	// 下载文件
	window.open(`/api/return_records/statistics/export?${params}`, '_blank');
}

// ===================== 统计功能 =====================

// 显示统计详情
async function showStatistics() {
	try {
		// 获取所有记录用于统计（不分页）
		let allRecordsForStats = [];
		
		if (currentSearchData) {
			// 如果有搜索条件，使用搜索条件获取所有记录
			const searchData = {
				record_type: document.getElementById('searchRecordType').value,
				name: document.getElementById('searchName').value,
				date: document.getElementById('searchDate').value,
				completion_status: document.getElementById('searchCompletionStatus').value,
				owner: document.getElementById('searchOwner').value,
				sort_method: document.getElementById('searchSortMethod').value
			};
			
			const response = await fetch('/api/records/search', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					...searchData,
					page: 1,
					per_page: 10000  // 获取大量记录，确保获取所有符合条件的记录
				})
			});
			
			if (response.ok) {
				const data = await response.json();
				allRecordsForStats = data.records || [];
			}
		} else {
			// 如果没有搜索条件，获取所有记录
			const sortMethod = document.getElementById('searchSortMethod').value;
			const params = new URLSearchParams({
				page: 1,
				per_page: 10000,  // 获取大量记录，确保获取所有记录
				sort_method: sortMethod
			});
			
			const response = await fetch(`/api/records?${params}`);
			if (response.ok) {
				const data = await response.json();
				allRecordsForStats = data.records || [];
			}
		}
		
		// 加载基础统计
		loadBasicStats(allRecordsForStats);
		
		// 加载详细分析
		loadDetailedAnalysis(allRecordsForStats);
		
		// 加载人员分析
		loadPersonAnalysis(allRecordsForStats);
		
		const modal = new bootstrap.Modal(document.getElementById('statisticsModal'));
		modal.show();
	} catch (error) {
		console.error('Error:', error);
		showAlert('获取统计信息失败，请检查网络连接', 'error');
	}
}

// 加载基础统计
function loadBasicStats(allRecords) {
	// 使用传入的所有记录进行计算
	const giftRecords = allRecords.filter(r => r.record_type === "受礼记录");
	const returnRecords = allRecords.filter(r => r.record_type === "随礼记录");
	
	// 按所属人统计
	const giftRecordsA = giftRecords.filter(r => r.owner === '郭宁' || !r.owner);
	const returnRecordsA = returnRecords.filter(r => r.owner === '郭宁' || !r.owner);
	const giftRecordsB = giftRecords.filter(r => r.owner === '李佳慧');
	const returnRecordsB = returnRecords.filter(r => r.owner === '李佳慧');
	
	// 按照新规则计算金额
	// 郭宁受礼总额 = 郭宁的受礼记录金额 + 郭宁的随礼记录中的回礼金额
	const totalGiftAmountA = (
		giftRecordsA.reduce((sum, r) => sum + parseFloat(r.amount), 0) +
		returnRecordsA.reduce((sum, r) => sum + parseFloat(r.return_amount || 0), 0)
	);
	
	// 郭宁随礼总额 = 郭宁的受礼记录中的回礼金额 + 郭宁的随礼记录金额
	const totalReturnAmountA = (
		giftRecordsA.reduce((sum, r) => sum + parseFloat(r.return_amount || 0), 0) +
		returnRecordsA.reduce((sum, r) => sum + parseFloat(r.amount), 0)
	);
	
	// 李佳慧受礼总额 = 李佳慧的受礼记录金额 + 李佳慧的随礼记录中的回礼金额
	const totalGiftAmountB = (
		giftRecordsB.reduce((sum, r) => sum + parseFloat(r.amount), 0) +
		returnRecordsB.reduce((sum, r) => sum + parseFloat(r.return_amount || 0), 0)
	);
	
	// 李佳慧随礼总额 = 李佳慧的受礼记录中的回礼金额 + 李佳慧的随礼记录金额
	const totalReturnAmountB = (
		giftRecordsB.reduce((sum, r) => sum + parseFloat(r.return_amount || 0), 0) +
		returnRecordsB.reduce((sum, r) => sum + parseFloat(r.amount), 0)
	);
	
	let statsHTML = `
		<div class="row">
			<div class="col-md-6">
				<div class="card">
					<div class="card-header">
						<h6><i class="bi bi-person-circle me-2"></i>郭宁 - 受礼统计</h6>
					</div>
					<div class="card-body">
						<div class="row">
							<div class="col-6">
								<div class="stats-card">
									<div class="stats-label">总记录数</div>
									<div class="stats-number">${giftRecordsA.length}</div>
								</div>
							</div>
							<div class="col-6">
								<div class="stats-card">
									<div class="stats-label">总金额</div>
									<div class="stats-number">${totalGiftAmountA.toFixed(2)}</div>
									<div class="stats-label">元</div>
								</div>
							</div>
						</div>
						<div class="mt-3">
							<p><i class="bi bi-check-circle text-success me-2"></i>已回礼: ${giftRecordsA.filter(r => r.return_amount > 0).length} 条</p>
							<p><i class="bi bi-calculator text-primary me-2"></i>平均金额: ${giftRecordsA.length > 0 ? (totalGiftAmountA / giftRecordsA.length).toFixed(2) : 0} 元</p>
						</div>
					</div>
				</div>
			</div>
			<div class="col-md-6">
				<div class="card">
					<div class="card-header">
						<h6><i class="bi bi-person-circle me-2"></i>郭宁 - 随礼统计</h6>
					</div>
					<div class="card-body">
						<div class="row">
							<div class="col-6">
								<div class="stats-card">
									<div class="stats-label">总记录数</div>
									<div class="stats-number">${returnRecordsA.length}</div>
								</div>
							</div>
							<div class="col-6">
								<div class="stats-card">
									<div class="stats-label">总金额</div>
									<div class="stats-number">${totalReturnAmountA.toFixed(2)}</div>
									<div class="stats-label">元</div>
								</div>
							</div>
						</div>
						<div class="mt-3">
							<p><i class="bi bi-check-circle text-success me-2"></i>收到回礼: ${returnRecordsA.filter(r => r.return_amount > 0).length} 条</p>
							<p><i class="bi bi-calculator text-primary me-2"></i>平均金额: ${returnRecordsA.length > 0 ? (totalReturnAmountA / returnRecordsA.length).toFixed(2) : 0} 元</p>
						</div>
					</div>
				</div>
			</div>
		</div>
		
		<div class="row mt-4">
			<div class="col-md-6">
				<div class="card">
					<div class="card-header">
						<h6><i class="bi bi-person-circle me-2"></i>李佳慧 - 受礼统计</h6>
					</div>
					<div class="card-body">
						<div class="row">
							<div class="col-6">
								<div class="stats-card">
									<div class="stats-label">总记录数</div>
									<div class="stats-number">${giftRecordsB.length}</div>
								</div>
							</div>
							<div class="col-6">
								<div class="stats-card">
									<div class="stats-label">总金额</div>
									<div class="stats-number">${totalGiftAmountB.toFixed(2)}</div>
									<div class="stats-label">元</div>
								</div>
							</div>
						</div>
						<div class="mt-3">
							<p><i class="bi bi-check-circle text-success me-2"></i>已回礼: ${giftRecordsB.filter(r => r.return_amount > 0).length} 条</p>
							<p><i class="bi bi-calculator text-primary me-2"></i>平均金额: ${giftRecordsB.length > 0 ? (totalGiftAmountB / giftRecordsB.length).toFixed(2) : 0} 元</p>
						</div>
					</div>
				</div>
			</div>
			<div class="col-md-6">
				<div class="card">
					<div class="card-header">
						<h6><i class="bi bi-person-circle me-2"></i>李佳慧 - 随礼统计</h6>
					</div>
					<div class="card-body">
						<div class="row">
							<div class="col-6">
								<div class="stats-card">
									<div class="stats-label">总记录数</div>
									<div class="stats-number">${returnRecordsB.length}</div>
								</div>
							</div>
							<div class="col-6">
								<div class="stats-card">
									<div class="stats-label">总金额</div>
									<div class="stats-number">${totalReturnAmountB.toFixed(2)}</div>
									<div class="stats-label">元</div>
								</div>
							</div>
						</div>
						<div class="mt-3">
							<p><i class="bi bi-check-circle text-success me-2"></i>收到回礼: ${returnRecordsB.filter(r => r.return_amount > 0).length} 条</p>
							<p><i class="bi bi-calculator text-primary me-2"></i>平均金额: ${returnRecordsB.length > 0 ? (totalReturnAmountB / returnRecordsB.length).toFixed(2) : 0} 元</p>
						</div>
					</div>
				</div>
			</div>
		</div>
		
		<div class="row mt-4">
			<div class="col-12">
				<div class="card">
					<div class="card-header">
						<h6><i class="bi bi-bar-chart me-2"></i>汇总信息</h6>
					</div>
					<div class="card-body">
						<div class="row text-center">
							<div class="col-4">
								<div class="stats-card">
									<div class="stats-label">总记录数</div>
									<div class="stats-number">${allRecords.length}</div>
								</div>
							</div>
							<div class="col-4">
								<div class="stats-card">
									<div class="stats-label">已完成回礼</div>
									<div class="stats-number">${allRecords.filter(r => calculateCompletionStatus(r) === "已完成").length}</div>
								</div>
							</div>
							<div class="col-4">
								<div class="stats-card">
									<div class="stats-label">净收支</div>
									<div class="stats-number ${(totalGiftAmountA + totalGiftAmountB - totalReturnAmountA - totalReturnAmountB) >= 0 ? 'text-success' : 'text-danger'}">${(totalGiftAmountA + totalGiftAmountB - totalReturnAmountA - totalReturnAmountB).toFixed(2)}</div>
									<div class="stats-label">元</div>
								</div>
							</div>
						</div>
						<div class="mt-4">
							<p><i class="bi bi-currency-exchange text-primary me-2"></i>郭宁受礼总额: <strong>${totalGiftAmountA.toFixed(2)}</strong> 元</p>
							<p><i class="bi bi-currency-exchange text-primary me-2"></i>郭宁随礼总额: <strong>${totalReturnAmountA.toFixed(2)}</strong> 元</p>
							<p><i class="bi bi-currency-exchange text-primary me-2"></i>李佳慧受礼总额: <strong>${totalGiftAmountB.toFixed(2)}</strong> 元</p>
							<p><i class="bi bi-currency-exchange text-primary me-2"></i>李佳慧随礼总额: <strong>${totalReturnAmountB.toFixed(2)}</strong> 元</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	`;
	
	document.getElementById('basicStatsContent').innerHTML = statsHTML;
}

// 加载详细分析
function loadDetailedAnalysis(allRecords) {
	// 金额区间分布分析
	const amountRanges = [
		{ min: 0, max: 200, label: '0-200元' },
		{ min: 201, max: 500, label: '201-500元' },
		{ min: 501, max: 1000, label: '501-1000元' },
		{ min: 1001, max: Infinity, label: '1000元以上' }
	];
	
	let amountRangeHTML = '<div class="card mb-4"><div class="card-header"><h6><i class="bi bi-cash-coin me-2"></i>金额区间分布</h6></div><div class="card-body"><div class="row">';
	amountRanges.forEach(range => {
		const giftRecords = allRecords.filter(r => r.record_type === "受礼记录" && r.amount >= range.min && r.amount <= range.max);
		const returnRecords = allRecords.filter(r => r.record_type === "随礼记录" && r.amount >= range.min && r.amount <= range.max);
		
		const giftTotal = giftRecords.reduce((sum, r) => sum + parseFloat(r.amount), 0);
		const returnTotal = returnRecords.reduce((sum, r) => sum + parseFloat(r.amount), 0);
		
		const percentage = allRecords.length > 0 ? ((giftRecords.length + returnRecords.length) / allRecords.length * 100).toFixed(1) : 0;
		
		amountRangeHTML += `
			<div class="col-md-3">
				<div class="stats-card">
					<div class="stats-label">${range.label}</div>
					<div class="stats-number">${giftRecords.length + returnRecords.length}</div>
					<div class="stats-label">${percentage}% 占比</div>
					<div class="mt-2">
						<small class="text-muted">受礼: ${giftRecords.length}条 (${giftTotal.toFixed(2)}元)</small><br>
						<small class="text-muted">随礼: ${returnRecords.length}条 (${returnTotal.toFixed(2)}元)</small>
					</div>
				</div>
			</div>
		`;
	});
	amountRangeHTML += '</div></div></div>';
	
	// 年度趋势分析
	const currentYear = new Date().getFullYear();
	const years = [currentYear, currentYear - 1, currentYear - 2];
	
	let yearTrendHTML = '<div class="card mb-4"><div class="card-header"><h6><i class="bi bi-calendar-range me-2"></i>年度趋势分析</h6></div><div class="card-body"><div class="row">';
	years.forEach(year => {
		const yearGiftRecords = allRecords.filter(r => r.record_type === "受礼记录" && new Date(r.date).getFullYear() === year);
		const yearReturnRecords = allRecords.filter(r => r.record_type === "随礼记录" && new Date(r.date).getFullYear() === year);
		
		const giftTotal = yearGiftRecords.reduce((sum, r) => sum + parseFloat(r.amount), 0);
		const returnTotal = yearReturnRecords.reduce((sum, r) => sum + parseFloat(r.amount), 0);
		
		const returnAmount = yearGiftRecords.reduce((sum, r) => sum + parseFloat(r.return_amount || 0), 0);
		const receivedReturn = yearReturnRecords.reduce((sum, r) => sum + parseFloat(r.return_amount || 0), 0);
		
		yearTrendHTML += `
			<div class="col-md-4">
				<div class="card">
					<div class="card-header">
						<h6 class="mb-0">${year}年</h6>
					</div>
					<div class="card-body">
						<div class="row">
							<div class="col-6">
								<div class="text-center mb-3">
									<div class="text-success fw-bold">受礼</div>
									<div class="h5">${yearGiftRecords.length}</div>
									<div class="text-muted small">${giftTotal.toFixed(2)}元</div>
								</div>
							</div>
							<div class="col-6">
								<div class="text-center mb-3">
									<div class="text-warning fw-bold">随礼</div>
									<div class="h5">${yearReturnRecords.length}</div>
									<div class="text-muted small">${returnTotal.toFixed(2)}元</div>
								</div>
							</div>
						</div>
						<div class="mt-2">
							<small class="text-muted">回礼: ${returnAmount.toFixed(2)}元</small><br>
							<small class="text-muted">收到回礼: ${receivedReturn.toFixed(2)}元</small>
						</div>
					</div>
				</div>
			</div>
		`;
	});
	yearTrendHTML += '</div></div></div>';
	
	// 最近12个月活动分析
	const months = [];
	for (let i = 0; i < 12; i++) {
		const date = new Date();
		date.setMonth(date.getMonth() - i);
		months.push({
			year: date.getFullYear(),
			month: date.getMonth() + 1,
			label: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
		});
	}
	
	let monthAnalysisHTML = '<div class="card mb-4"><div class="card-header"><h6><i class="bi bi-calendar-month me-2"></i>最近12个月活动分析</h6></div><div class="card-body"><div class="table-responsive"><table class="table table-sm"><thead><tr><th>月份</th><th>受礼</th><th>随礼</th><th>回礼</th><th>收到回礼</th></tr></thead><tbody>';
	months.forEach(monthData => {
		const monthGiftRecords = allRecords.filter(r => {
			const recordDate = new Date(r.date);
			return r.record_type === "受礼记录" && 
				   recordDate.getFullYear() === monthData.year && 
				   recordDate.getMonth() + 1 === monthData.month;
		});
		
		const monthReturnRecords = allRecords.filter(r => {
			const recordDate = new Date(r.date);
			return r.record_type === "随礼记录" && 
				   recordDate.getFullYear() === monthData.year && 
				   recordDate.getMonth() + 1 === monthData.month;
		});
		
		if (monthGiftRecords.length > 0 || monthReturnRecords.length > 0) {
			const giftTotal = monthGiftRecords.reduce((sum, r) => sum + parseFloat(r.amount), 0);
			const returnTotal = monthReturnRecords.reduce((sum, r) => sum + parseFloat(r.amount), 0);
			
			const returnAmount = monthGiftRecords.reduce((sum, r) => sum + parseFloat(r.return_amount || 0), 0);
			const receivedReturn = monthReturnRecords.reduce((sum, r) => sum + parseFloat(r.return_amount || 0), 0);
			
			monthAnalysisHTML += `
				<tr>
					<td>${monthData.label}</td>
					<td>${monthGiftRecords.length} (${giftTotal.toFixed(2)}元)</td>
					<td>${monthReturnRecords.length} (${returnTotal.toFixed(2)}元)</td>
					<td>${returnAmount.toFixed(2)}元</td>
					<td>${receivedReturn.toFixed(2)}元</td>
				</tr>
			`;
		}
	});
	monthAnalysisHTML += '</tbody></table></div></div></div>';
	
	// 人员往来分析（按总金额前10名）
	const personMap = {};
	allRecords.forEach(record => {
		if (!personMap[record.name]) {
			personMap[record.name] = {
				name: record.name,
				giftCount: 0,
				giftAmount: 0,
				returnCount: 0,
				returnAmount: 0,
				occasions: new Set(),
				returnGiven: 0,
				returnReceived: 0
			};
		}
		
		const person = personMap[record.name];
		person.occasions.add(record.occasion);
		
		if (record.record_type === "受礼记录") {
			person.giftCount++;
			person.giftAmount += parseFloat(record.amount);
			person.returnGiven += parseFloat(record.return_amount || 0);
		} else {
			person.returnCount++;
			person.returnAmount += parseFloat(record.amount);
			person.returnReceived += parseFloat(record.return_amount || 0);
		}
	});
	
	const sortedPersons = Object.values(personMap)
		.sort((a, b) => (b.giftAmount + b.returnAmount) - (a.giftAmount + a.returnAmount))
		.slice(0, 10);
	
	let personAnalysisHTML = '<div class="card mb-4"><div class="card-header"><h6><i class="bi bi-people me-2"></i>人员往来分析（按总金额前10名）</h6></div><div class="card-body"><div class="table-responsive"><table class="table table-sm"><thead><tr><th>排名</th><th>姓名</th><th>往来次数</th><th>场合数</th><th>受礼金额</th><th>随礼金额</th><th>回礼</th><th>收到回礼</th><th>净收支</th></tr></thead><tbody>';
	sortedPersons.forEach((person, index) => {
		const totalInteractions = person.giftCount + person.returnCount;
		const netAmount = (person.giftAmount + person.returnReceived) - (person.returnAmount + person.returnGiven);
		const netClass = netAmount >= 0 ? 'text-success' : 'text-danger';
		
		personAnalysisHTML += `
			<tr>
				<td>${index + 1}</td>
				<td><strong>${person.name}</strong></td>
				<td>${totalInteractions}</td>
				<td>${person.occasions.size}</td>
				<td>${person.giftAmount.toFixed(2)}</td>
				<td>${person.returnAmount.toFixed(2)}</td>
				<td>${person.returnGiven.toFixed(2)}</td>
				<td>${person.returnReceived.toFixed(2)}</td>
				<td class="${netClass}"><strong>${netAmount >= 0 ? '+' : ''}${netAmount.toFixed(2)}</strong></td>
			</tr>
		`;
	});
	personAnalysisHTML += '</tbody></table></div></div></div>';
	
	// 事件分析
	const giftOccasions = {};
	const returnOccasions = {};
	
	allRecords.forEach(record => {
		if (record.record_type === "受礼记录") {
			if (!giftOccasions[record.occasion]) {
				giftOccasions[record.occasion] = {
					count: 0,
					totalAmount: 0,
					people: new Set(),
					returnCount: 0
				};
			}
			giftOccasions[record.occasion].count++;
			giftOccasions[record.occasion].totalAmount += parseFloat(record.amount);
			giftOccasions[record.occasion].people.add(record.name);
			if (record.return_amount > 0) giftOccasions[record.occasion].returnCount++;
		} else {
			if (!returnOccasions[record.occasion]) {
				returnOccasions[record.occasion] = {
					count: 0,
					totalAmount: 0,
					people: new Set(),
					returnCount: 0
				};
			}
			returnOccasions[record.occasion].count++;
			returnOccasions[record.occasion].totalAmount += parseFloat(record.amount);
			returnOccasions[record.occasion].people.add(record.name);
			if (record.return_amount > 0) returnOccasions[record.occasion].returnCount++;
		}
	});
	
	// 按金额排序
	const sortedGiftOccasions = Object.entries(giftOccasions)
		.sort(([, a], [, b]) => b.totalAmount - a.totalAmount)
		.slice(0, 10);
	
	const sortedReturnOccasions = Object.entries(returnOccasions)
		.sort(([, a], [, b]) => b.totalAmount - a.totalAmount)
		.slice(0, 10);
	
	let occasionHTML = '<div class="row"><div class="col-md-6"><div class="card mb-4"><div class="card-header"><h6><i class="bi bi-gift me-2"></i>热门受礼事件（前10）</h6></div><div class="card-body"><div class="table-responsive"><table class="table table-sm"><thead><tr><th>事件</th><th>次数</th><th>人数</th><th>总金额</th><th>回礼率</th></tr></thead><tbody>';
	sortedGiftOccasions.forEach(([occasion, data]) => {
		const avgAmount = data.totalAmount / data.count;
		const returnRate = (data.returnCount / data.count * 100).toFixed(1);
		occasionHTML += `<tr><td>${occasion}</td><td>${data.count}</td><td>${data.people.size}</td><td>${data.totalAmount.toFixed(2)}元</td><td>${returnRate}%</td></tr>`;
	});
	occasionHTML += '</tbody></table></div></div></div></div><div class="col-md-6"><div class="card mb-4"><div class="card-header"><h6><i class="bi bi-arrow-return-right me-2"></i>热门随礼事件（前10）</h6></div><div class="card-body"><div class="table-responsive"><table class="table table-sm"><thead><tr><th>事件</th><th>次数</th><th>人数</th><th>总金额</th><th>回礼率</th></tr></thead><tbody>';
	sortedReturnOccasions.forEach(([occasion, data]) => {
		const avgAmount = data.totalAmount / data.count;
		const returnRate = (data.returnCount / data.count * 100).toFixed(1);
		occasionHTML += `<tr><td>${occasion}</td><td>${data.count}</td><td>${data.people.size}</td><td>${data.totalAmount.toFixed(2)}元</td><td>${returnRate}%</td></tr>`;
	});
	occasionHTML += '</tbody></table></div></div></div></div></div>';
	
	// 未完成往来明细
	const incompleteRecords = allRecords
		.filter(record => {
			const status = calculateCompletionStatus(record);
			return status === "仅受礼" || status === "仅随礼";
		})
		.sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount))
		.slice(0, 10);
	
	let incompleteHTML = '<div class="card mb-4"><div class="card-header"><h6><i class="bi bi-clock-history me-2"></i>未完成往来明细（金额前10名）</h6></div><div class="card-body"><div class="table-responsive"><table class="table table-sm"><thead><tr><th>姓名</th><th>事件</th><th>金额</th><th>状态</th><th>日期</th><th>天数</th></tr></thead><tbody>';
	incompleteRecords.forEach((record, index) => {
		const status = calculateCompletionStatus(record);
		const recordDate = new Date(record.date);
		const today = new Date();
		const daysAgo = Math.floor((today - recordDate) / (1000 * 60 * 60 * 24));
		const statusColor = status === "仅受礼" ? "text-primary" : "text-warning";
		
		incompleteHTML += `<tr><td>${record.name}</td><td>${record.occasion}</td><td>${parseFloat(record.amount).toFixed(2)}元</td><td class="${statusColor}">${status}</td><td>${record.date}</td><td>${daysAgo}天前</td></tr>`;
	});
	incompleteHTML += '</tbody></table></div></div></div>';
	
	// 组合所有详细分析内容
	const detailedHTML = `
		${amountRangeHTML}
		${yearTrendHTML}
		${monthAnalysisHTML}
		${personAnalysisHTML}
		${occasionHTML}
		${incompleteHTML}
	`;
	
	document.getElementById('detailedAnalysisContent').innerHTML = detailedHTML;
}

// 加载人员分析
function loadPersonAnalysis(allRecords) {
	const personMap = {};
	
	// 统计每个人的所有往来记录
	allRecords.forEach(record => {
		if (!personMap[record.name]) {
			personMap[record.name] = {
				name: record.name,
				giftRecords: [],
				returnRecords: [],
				occasions: new Set()
			};
		}
		
		const person = personMap[record.name];
		person.occasions.add(record.occasion);
		
		if (record.record_type === "受礼记录") {
			person.giftRecords.push(record);
		} else {
			person.returnRecords.push(record);
		}
	});
	
	// 计算每个人的统计信息
	const personStats = Object.values(personMap).map(person => {
		const giftTotal = person.giftRecords.reduce((sum, r) => sum + parseFloat(r.amount), 0);
		const returnTotal = person.returnRecords.reduce((sum, r) => sum + parseFloat(r.amount), 0);
		const returnGiven = person.giftRecords.reduce((sum, r) => sum + parseFloat(r.return_amount || 0), 0);
		const returnReceived = person.returnRecords.reduce((sum, r) => sum + parseFloat(r.return_amount || 0), 0);
		
		// 净收支计算：
		const netAmount = (giftTotal + returnReceived) - (returnTotal + returnGiven);
		
		return {
			name: person.name,
			totalInteractions: person.giftRecords.length + person.returnRecords.length,
			occasionCount: person.occasions.size,
			giftCount: person.giftRecords.length,
			giftAmount: giftTotal,
			returnCount: person.returnRecords.length,
			returnAmount: returnTotal,
			returnGiven: returnGiven,
			returnReceived: returnReceived,
			netAmount: netAmount
		};
	});
	
	// 按总往来金额排序
	personStats.sort((a, b) => (b.giftAmount + b.returnAmount) - (a.giftAmount + a.returnAmount));
	
	let personHTML = '<div class="card"><div class="card-header"><h6><i class="bi bi-person-lines-fill me-2"></i>人员详细分析</h6></div><div class="card-body"><div class="table-responsive"><table class="table table-sm table-hover"><thead><tr><th>姓名</th><th>往来次数</th><th>场合数</th><th>受礼次数</th><th>受礼金额</th><th>随礼次数</th><th>随礼金额</th><th>回礼金额</th><th>收到回礼</th><th class="text-end">净收支</th></tr></thead><tbody>';
	
	personStats.forEach(person => {
		const netClass = person.netAmount >= 0 ? 'text-success' : 'text-danger';
		const netText = person.netAmount >= 0 ? `+${person.netAmount.toFixed(2)}` : person.netAmount.toFixed(2);
		
		personHTML += `
			<tr>
				<td><strong>${person.name}</strong></td>
				<td>${person.totalInteractions}</td>
				<td>${person.occasionCount}</td>
				<td>${person.giftCount}</td>
				<td>${person.giftAmount.toFixed(2)}</td>
				<td>${person.returnCount}</td>
				<td>${person.returnAmount.toFixed(2)}</td>
				<td>${person.returnGiven.toFixed(2)}</td>
				<td>${person.returnReceived.toFixed(2)}</td>
				<td class="${netClass} text-end"><strong>${netText}</strong></td>
			</tr>
		`;
	});
	
	personHTML += '</tbody></table></div></div></div>';
	
	document.getElementById('personAnalysisContent').innerHTML = personHTML;
}

// ===================== 系统日志功能 =====================

// 打开系统日志模态框
function openSystemLogsModal() {
	currentLogPage = 1;
	loadSystemLogs();
	const modal = new bootstrap.Modal(document.getElementById('systemLogsModal'));
	modal.show();
}

// 加载系统日志
async function loadSystemLogs() {
	const operationType = document.getElementById('logOperationType').value;
	const dateRange = document.getElementById('logDateRange').value;
	const keyword = document.getElementById('logKeyword').value;

	try {
		const params = new URLSearchParams({
			page: currentLogPage,
			per_page: logsPerPage,
			operation_type: operationType,
			date_range: dateRange,
			keyword: keyword
		});

		const response = await fetch(`/api/logs?${params}`);
		if (response.ok) {
			const data = await response.json();
			renderSystemLogs(data.logs);
			updateLogsPagination(data);
			updateLogsStats(data);
		} else {
			showAlert('加载日志失败', 'error');
		}
	} catch (error) {
		console.error('Error:', error);
		showAlert('加载日志失败，请检查网络连接', 'error');
	}
}

// 渲染系统日志表格
function renderSystemLogs(logs) {
	const tbody = document.getElementById('logsTableBody');
	tbody.innerHTML = '';

	if (logs.length === 0) {
		const tr = document.createElement('tr');
		tr.innerHTML = `<td colspan="7" class="text-center py-5 text-muted">
			<div class="empty-state">
				<i class="bi bi-inbox"></i>
				<p class="mt-2">暂无日志记录</p>
			</div>
		</td>`;
		tbody.appendChild(tr);
		return;
	}

	const startIndex = (currentLogPage - 1) * logsPerPage + 1;
	
	logs.forEach((log, index) => {
		// 根据操作类型设置标签颜色
		let badgeColor = 'bg-primary';
		if (log.operation_type === 'DELETE' || log.operation_type === 'ERROR') {
			badgeColor = 'bg-danger';
		} else if (log.operation_type === 'EDIT' || log.operation_type === 'UPDATE') {
			badgeColor = 'bg-warning';
		} else if (log.operation_type === 'ADD' || log.operation_type === 'CREATE') {
			badgeColor = 'bg-success';
		} else if (log.operation_type === 'LOGIN' || log.operation_type === 'LOGOUT') {
			badgeColor = 'bg-info';
		}
		
		const tr = document.createElement('tr');
		tr.innerHTML = `
			<td>${startIndex + index}</td>
			<td>${log.created_at}</td>
			<td><span class="badge ${badgeColor}">${log.operation_type}</span></td>
			<td>
				<div class="log-details">${log.operation_details}</div>
			</td>
			<td>${log.user_name}</td>
			<td>${log.record_id || '-'}</td>
			<td>${log.ip_address}</td>
		`;
		tbody.appendChild(tr);
	});
}

// 更新日志分页
function updateLogsPagination(data) {
	const pagination = document.getElementById('logsPagination');
	pagination.innerHTML = '';

	totalLogPages = data.total_pages;
	totalLogs = data.total;

	// 首页按钮
	const firstLi = document.createElement('li');
	firstLi.className = `page-item ${currentLogPage === 1 ? 'disabled' : ''}`;
	firstLi.innerHTML = `
		<a class="page-link" href="#" aria-label="首页" data-page="1">
			<i class="bi bi-chevron-double-left"></i>
		</a>
	`;
	pagination.appendChild(firstLi);

	// 上一页按钮
	const prevLi = document.createElement('li');
	prevLi.className = `page-item ${currentLogPage === 1 ? 'disabled' : ''}`;
	prevLi.innerHTML = `
		<a class="page-link" href="#" aria-label="上一页" data-page="${currentLogPage - 1}">
			<i class="bi bi-chevron-left"></i>
		</a>
	`;
	pagination.appendChild(prevLi);

	// 页码按钮
	const maxVisiblePages = 5;
	let startPage = Math.max(1, currentLogPage - Math.floor(maxVisiblePages / 2));
	let endPage = Math.min(totalLogPages, startPage + maxVisiblePages - 1);
	
	if (endPage - startPage + 1 < maxVisiblePages) {
		startPage = Math.max(1, endPage - maxVisiblePages + 1);
	}

	if (startPage > 1) {
		const pageLi = document.createElement('li');
		pageLi.className = 'page-item';
		pageLi.innerHTML = `<a class="page-link" href="#" data-page="1">1</a>`;
		pagination.appendChild(pageLi);
		
		if (startPage > 2) {
			const ellipsisLi = document.createElement('li');
			ellipsisLi.className = 'page-item disabled';
			ellipsisLi.innerHTML = `<span class="page-link">...</span>`;
			pagination.appendChild(ellipsisLi);
		}
	}

	for (let i = startPage; i <= endPage; i++) {
		const pageLi = document.createElement('li');
		pageLi.className = `page-item ${i === currentLogPage ? 'active' : ''}`;
		pageLi.innerHTML = `<a class="page-link" href="#" data-page="${i}">${i}</a>`;
		pagination.appendChild(pageLi);
	}

	if (endPage < totalLogPages) {
		if (endPage < totalLogPages - 1) {
			const ellipsisLi = document.createElement('li');
			ellipsisLi.className = 'page-item disabled';
			ellipsisLi.innerHTML = `<span class="page-link">...</span>`;
			pagination.appendChild(ellipsisLi);
		}
		
		const pageLi = document.createElement('li');
		pageLi.className = 'page-item';
		pageLi.innerHTML = `<a class="page-link" href="#" data-page="${totalLogPages}">${totalLogPages}</a>`;
		pagination.appendChild(pageLi);
	}

	// 下一页按钮
	const nextLi = document.createElement('li');
	nextLi.className = `page-item ${currentLogPage === totalLogPages ? 'disabled' : ''}`;
	nextLi.innerHTML = `
		<a class="page-link" href="#" aria-label="下一页" data-page="${currentLogPage + 1}">
			<i class="bi bi-chevron-right"></i>
		</a>
	`;
	pagination.appendChild(nextLi);

	// 尾页按钮
	const lastLi = document.createElement('li');
	lastLi.className = `page-item ${currentLogPage === totalLogPages ? 'disabled' : ''}`;
	lastLi.innerHTML = `
		<a class="page-link" href="#" aria-label="尾页" data-page="${totalLogPages}">
			<i class="bi bi-chevron-double-right"></i>
		</a>
	`;
	pagination.appendChild(lastLi);

	// 更新日志跳转输入框
	updateLogPageJumpInput();

	// 添加分页点击事件
	document.querySelectorAll('#logsPagination .page-link').forEach(link => {
		link.addEventListener('click', function(e) {
			e.preventDefault();
			const page = parseInt(this.getAttribute('data-page'));
			if (page && !isNaN(page)) {
				changeLogPage(page);
			}
		});
	});
}

// 更新日志页码跳转输入框
function updateLogPageJumpInput() {
	const logPageJumpInput = document.getElementById('logPageJumpInput');
	logPageJumpInput.value = currentLogPage;
	logPageJumpInput.max = totalLogPages;
	logPageJumpInput.min = 1;
}

// 跳转到指定日志页面
function jumpToLogPage() {
	const logPageJumpInput = document.getElementById('logPageJumpInput');
	const targetPage = parseInt(logPageJumpInput.value);
	
	if (isNaN(targetPage) || targetPage < 1 || targetPage > totalLogPages) {
		showAlert(`请输入有效的页码 (1-${totalLogPages})`, 'error');
		logPageJumpInput.value = currentLogPage;
		return;
	}
	
	changeLogPage(targetPage);
}

// 切换日志页码
function changeLogPage(page) {
	if (page < 1 || page > totalLogPages) return;
	currentLogPage = page;
	loadSystemLogs();
}

// 更新日志统计信息
function updateLogsStats(data) {
	const startItem = (currentLogPage - 1) * logsPerPage + 1;
	const endItem = Math.min(currentLogPage * logsPerPage, data.total);
	document.getElementById('logsPaginationInfo').textContent = 
		`显示 ${startItem}-${endItem} 条，共 ${data.total} 条记录`;
}

// 导出日志
async function exportSystemLogs() {
	const operationType = document.getElementById('logOperationType').value;
	const dateRange = document.getElementById('logDateRange').value;
	const keyword = document.getElementById('logKeyword').value;

	try {
		// 获取所有符合条件的日志（不分页）
		const params = new URLSearchParams({
			page: 1,
			per_page: 10000, // 很大的数字，获取所有记录
			operation_type: operationType,
			date_range: dateRange,
			keyword: keyword
		});

		const response = await fetch(`/api/logs?${params}`);
		if (response.ok) {
			const data = await response.json();
			
			// 创建日志文本
			let logText = "礼尚往来管理系统 - 操作日志\n";
			logText += `导出时间: ${new Date().toLocaleString()}\n`;
			logText += `筛选条件: 操作类型=${operationType}, 时间范围=${dateRange}, 关键词=${keyword}\n`;
			logText += "=".repeat(80) + "\n\n";

			data.logs.forEach((log, index) => {
				logText += `${index + 1}. 时间: ${log.created_at}\n`;
				logText += `   类型: ${log.operation_type}\n`;
				logText += `   详情: ${log.operation_details}\n`;
				logText += `   用户: ${log.user_name}\n`;
				logText += `   记录ID: ${log.record_id || '-'}\n`;
				logText += `   IP地址: ${log.ip_address}\n`;
				logText += "-".repeat(60) + "\n";
			});

			// 创建下载
			const blob = new Blob([logText], { type: 'text/plain;charset=utf-8' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `系统日志_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
			
			showAlert(`日志导出成功！共导出 ${data.logs.length} 条记录`, 'success');
		} else {
			showAlert('导出日志失败', 'error');
		}
	} catch (error) {
		console.error('Error:', error);
		showAlert('导出日志失败，请检查网络连接', 'error');
	}
}

// 退出登录
function logout() {
	// 清除不活动计时器
	if (inactivityTimer) {
		clearTimeout(inactivityTimer);
	}
	
	showConfirm('确定要退出系统吗？', function() {
		window.location.href = '/logout';
	});
}

// ===================== 新增：礼尚往来记录导入功能 =====================

// 打开导入模态框
function openGiftImportModal() {
	resetGiftImportModal();
	const modal = new bootstrap.Modal(document.getElementById('importGiftRecordsModal'));
	modal.show();
}

// 重置导入模态框
function resetGiftImportModal() {
	document.getElementById('giftImportStep1').style.display = 'block';
	document.getElementById('giftImportStep2').style.display = 'none';
	document.getElementById('giftImportStep3').style.display = 'none';
	document.getElementById('giftImportProgress').style.display = 'none';
	document.getElementById('giftExcelFile').value = '';
	document.getElementById('giftFilePreview').style.display = 'none';
	document.getElementById('uploadGiftFileBtn').disabled = true;
}

// 下载模板
async function downloadGiftTemplate() {
	try {
		const response = await fetch('/api/gift_records/template');
		if (response.ok) {
			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = '礼尚往来记录导入模板.xlsx';
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			window.URL.revokeObjectURL(url);
			showAlert('模板下载成功！', 'success');
		} else {
			showAlert('下载模板失败', 'error');
		}
	} catch (error) {
		console.error('下载模板错误:', error);
		showAlert('下载模板失败，请检查网络连接', 'error');
	}
}

// 导入文件
async function importGiftRecords() {
	const fileInput = document.getElementById('giftExcelFile');
	const file = fileInput.files[0];
	
	if (!file) {
		showAlert('请选择要导入的文件', 'error');
		return;
	}
	
	// 显示进度
	document.getElementById('giftImportStep2').style.display = 'none';
	document.getElementById('giftImportProgress').style.display = 'block';
	
	const formData = new FormData();
	formData.append('file', file);
	
	try {
		const response = await fetch('/api/gift_records/import', {
			method: 'POST',
			body: formData
		});
		
		const result = await response.json();
		
		// 显示结果
		document.getElementById('giftImportProgress').style.display = 'none';
		document.getElementById('giftImportStep3').style.display = 'block';
		
		// 在 importGiftRecords 函数的成功回调中
		if (result.success) {
			document.getElementById('giftImportResultTitle').textContent = '导入完成';
			document.getElementById('giftImportResultTitle').className = 'mt-2 fw-medium text-success';
			
			document.getElementById('giftSuccessCount').textContent = result.imported_count;
			document.getElementById('giftErrorCount').textContent = result.error_count;
			
			// 显示错误信息
			if (result.error_messages && result.error_messages.length > 0) {
				document.getElementById('giftErrorMessages').style.display = 'block';
				const errorList = document.getElementById('giftErrorList');
				errorList.innerHTML = '';
				
				result.error_messages.forEach(error => {
					const li = document.createElement('li');
					li.className = 'text-danger small';
					li.textContent = error;
					errorList.appendChild(li);
				});
				
				// 如果有更多错误，显示提示
				if (result.error_count > 10) {
					const moreInfo = document.createElement('li');
					moreInfo.className = 'text-muted small';
					moreInfo.textContent = `... 还有 ${result.error_count - 10} 条错误未显示`;
					errorList.appendChild(moreInfo);
				}
			}
			
			// 新增：显示重复记录信息
			if (result.duplicate_messages && result.duplicate_messages.length > 0) {
				const duplicateSection = document.createElement('div');
				duplicateSection.className = 'mt-4';
				duplicateSection.innerHTML = `
					<h6><i class="bi bi-exclamation-triangle text-warning me-2"></i>重复记录（跳过 ${result.duplicate_count} 条）</h6>
					<div class="card">
						<div class="card-body" style="max-height: 200px; overflow-y: auto;">
							<ul id="giftDuplicateList" class="mb-0 text-warning">
							</ul>
						</div>
					</div>
				`;
				document.getElementById('giftImportStep3').querySelector('.card-body').appendChild(duplicateSection);
				
				const duplicateList = document.getElementById('giftDuplicateList');
				result.duplicate_messages.forEach(message => {
					const li = document.createElement('li');
					li.className = 'text-warning small';
					li.textContent = message;
					duplicateList.appendChild(li);
				});
			}
			// 结束新增
			
			showAlert(result.message, 'success');
			
			// 重新加载数据
			setTimeout(() => {
				loadRecords();
			}, 1000);
			
		} else {
			document.getElementById('giftImportResultTitle').textContent = '导入失败';
			document.getElementById('giftImportResultTitle').className = 'mt-2 fw-medium text-danger';
			document.getElementById('giftSuccessCount').textContent = '0';
			document.getElementById('giftErrorCount').textContent = '0';
			showAlert(result.message, 'error');
		}
		
	} catch (error) {
		console.error('导入错误:', error);
		document.getElementById('giftImportProgress').style.display = 'none';
		document.getElementById('giftImportStep3').style.display = 'block';
		document.getElementById('giftImportResultTitle').textContent = '导入失败';
		document.getElementById('giftImportResultTitle').className = 'mt-2 fw-medium text-danger';
		showAlert('导入失败，请检查网络连接', 'error');
	}
}

// ==================== 页面初始化 ====================

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
	
	// 加载初始数据
	console.log("页面初始化，加载数据和统计信息");
	loadRecords();
	loadUserInfo();
	resetInactivityTimer();
	
	// 添加事件监听器来重置计时器
	document.addEventListener('mousemove', resetInactivityTimer);
	document.addEventListener('keypress', resetInactivityTimer);
	document.addEventListener('click', resetInactivityTimer);
	document.addEventListener('scroll', resetInactivityTimer);
	
	// ==================== 事件监听器绑定 ====================
	
	// 用户菜单功能事件绑定
	document.getElementById('changePasswordBtn').addEventListener('click', openChangePasswordModal);
	document.getElementById('changeSecurityQuestionBtn').addEventListener('click', openChangeSecurityQuestionModal);
	document.getElementById('systemLogsBtn').addEventListener('click', openSystemLogsModal);
	document.getElementById('logoutBtn').addEventListener('click', logout);
	document.getElementById('returnRecordsStatsBtn').addEventListener('click', openReturnRecordsStatsModal);
	document.getElementById('calculateReturnStats').addEventListener('click', calculateReturnRecordsStats);
	document.getElementById('exportReturnStats').addEventListener('click', exportReturnStats);
	
	// 礼尚往来记录导入功能事件绑定
	document.getElementById('importGiftRecordsBtn').addEventListener('click', openGiftImportModal);
	
	// 控制面板按钮事件绑定
	document.getElementById('refreshBtn').addEventListener('click', loadRecords);
	document.getElementById('statisticsBtn').addEventListener('click', showStatistics);
	document.getElementById('addRecordBtn').addEventListener('click', openAddModal);
	document.getElementById('deleteSelectedBtn').addEventListener('click', deleteSelectedRecords);
	document.getElementById('saveRecordBtn').addEventListener('click', saveRecord);
	document.getElementById('savePasswordBtn').addEventListener('click', changePassword);
	document.getElementById('selectAll').addEventListener('change', toggleSelectAll);
	
	// 修改安全问题事件监听
	document.getElementById('saveSecurityQuestionBtn').addEventListener('click', changeSecurityQuestion);
	
	// 事件统计功能事件监听
	document.getElementById('eventStatsBtn').addEventListener('click', openEventStatsModal);
	document.getElementById('calculateEventStats').addEventListener('click', calculateEventStats);
	document.getElementById('refreshEventList').addEventListener('click', refreshEventList);
	document.getElementById('showOnDashboard').addEventListener('click', showEventStatsOnDashboard);
	document.getElementById('closeEventStats').addEventListener('click', closeEventStats);
	
	// 动态调整表格高度
	function adjustTableHeight() {
		const tableContainer = document.querySelector('.table-container');
		if (!tableContainer) return;
		
		// 计算可用高度（减少上方元素的高度计算）
		const viewportHeight = window.innerHeight;
		const header = document.querySelector('.navbar');
		const controlPanel = document.querySelector('.control-panel');
		const searchPanel = document.querySelector('#searchForm').closest('.card');
		const statsPanel = document.querySelector('.stats-row');
		const cardHeader = document.querySelector('.card-header.d-flex');
		const pagination = document.querySelector('.compact-footer');
		
		let totalUsedHeight = 0;
		
		// 减少各组件的高度估算值
		if (header) totalUsedHeight += header.offsetHeight * 0.8;
		if (controlPanel) totalUsedHeight += controlPanel.offsetHeight * 0.8;
		if (searchPanel) totalUsedHeight += searchPanel.offsetHeight * 0.7;
		if (statsPanel) totalUsedHeight += statsPanel.offsetHeight * 0.7;
		if (cardHeader) totalUsedHeight += cardHeader.offsetHeight * 0.9;
		if (pagination) totalUsedHeight += pagination.offsetHeight * 0.9;
		
		// 减少边距
		totalUsedHeight += 20;
		
		const availableHeight = viewportHeight - totalUsedHeight;
		
		// 设置表格容器高度
		if (availableHeight > 300) {
			tableContainer.style.height = availableHeight + 'px';
			tableContainer.style.minHeight = '350px';  // 增加最小高度
		}
	}

	// 窗口大小改变时重新调整
	window.addEventListener('resize', adjustTableHeight);

	// 页面加载时调整
	setTimeout(adjustTableHeight, 100);
	setTimeout(adjustTableHeight, 500); // 延迟调整确保所有元素已渲染
	
	// 搜索功能
	document.getElementById('searchForm').addEventListener('submit', function(e) {
		e.preventDefault();
		currentPage = 1; // 搜索后回到第一页
		
		// 重置搜索数据
		currentSearchData = null;
		
		// 执行搜索
		searchRecords();
	});
	
	// 清空搜索时重置状态
	document.getElementById('clearSearchBtn').addEventListener('click', function() {
		document.getElementById('searchForm').reset();
		currentSearchData = null;  // 清空搜索状态
		currentPage = 1;  // 重置到第一页
		console.log(`清空搜索，重置到第1页，每页记录数: ${recordsPerPage}`);
		loadRecords();  // 重新加载
	});

	// 分页跳转功能
	document.getElementById('pageJumpBtn').addEventListener('click', jumpToPage);
	document.getElementById('pageJumpInput').addEventListener('keypress', function(e) {
		if (e.key === 'Enter') {
			jumpToPage();
		}
	});
	
	document.getElementById('logPageJumpBtn').addEventListener('click', jumpToLogPage);
	document.getElementById('logPageJumpInput').addEventListener('keypress', function(e) {
		if (e.key === 'Enter') {
			jumpToLogPage();
		}
	});

	// 每页记录数选择事件监听
	document.getElementById('recordsPerPageSelect').addEventListener('change', function() {
		const newRecordsPerPage = parseInt(this.value);
		console.log(`每页记录数改为: ${newRecordsPerPage} (原: ${recordsPerPage})`);
		
		// 如果改变了每页记录数，需要重置到第一页
		if (newRecordsPerPage !== recordsPerPage) {
			recordsPerPage = newRecordsPerPage;
			currentPage = 1; // 重置到第一页
			loadRecords();  // 重新加载
		}
	});
	
	// 添加排序下拉框change事件
	document.getElementById('searchSortMethod').addEventListener('change', function() {
		console.log(`排序方式改为: ${this.value}`);
		currentPage = 1; // 重置到第一页
		
		if (currentSearchData) {
			// 更新搜索条件中的排序方式
			currentSearchData.sort_method = this.value;
			// 使用更新后的搜索条件重新搜索
			searchRecords();
		} else {
			// 不是搜索状态，直接重新加载
			loadRecords();
		}
	});

	// 日志搜索
	document.getElementById('logSearchForm').addEventListener('submit', function(e) {
		e.preventDefault();
		currentLogPage = 1;
		loadSystemLogs();
	});

	// 清空日志搜索条件
	document.getElementById('clearLogSearchBtn').addEventListener('click', function() {
		document.getElementById('logSearchForm').reset();
		currentLogPage = 1;
		loadSystemLogs();
	});

	// 导出日志
	document.getElementById('exportLogsBtn').addEventListener('click', exportSystemLogs);

	// 导入功能事件绑定
	document.getElementById('downloadGiftTemplateBtn').addEventListener('click', downloadGiftTemplate);
	document.getElementById('giftNextToStep2Btn').addEventListener('click', function() {
		document.getElementById('giftImportStep1').style.display = 'none';
		document.getElementById('giftImportStep2').style.display = 'block';
	});
	document.getElementById('giftBackToStep1Btn').addEventListener('click', function() {
		document.getElementById('giftImportStep2').style.display = 'none';
		document.getElementById('giftImportStep1').style.display = 'block';
	});
	document.getElementById('giftExcelFile').addEventListener('change', function(e) {
		const file = e.target.files[0];
		if (file) {
			// 验证文件类型
			if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
				showAlert('请选择Excel文件(.xlsx或.xls)', 'error');
				this.value = '';
				return;
			}
			
			// 验证文件大小（10MB）
			if (file.size > 10 * 1024 * 1024) {
				showAlert('文件大小不能超过10MB', 'error');
				this.value = '';
				return;
			}
			
			// 显示文件预览
			document.getElementById('giftFileName').textContent = file.name;
			document.getElementById('giftFileSize').textContent = `大小: ${(file.size / 1024 / 1024).toFixed(2)} MB`;
			document.getElementById('giftFilePreview').style.display = 'block';
			document.getElementById('uploadGiftFileBtn').disabled = false;
		}
	});
	document.getElementById('uploadGiftFileBtn').addEventListener('click', importGiftRecords);
	document.getElementById('giftFinishImportBtn').addEventListener('click', function() {
		const modal = bootstrap.Modal.getInstance(document.getElementById('importGiftRecordsModal'));
		modal.hide();
	});

	// 设置默认日期为今天
	const today = new Date().toISOString().split('T')[0];
	document.getElementById('date').value = today;
});