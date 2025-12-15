// ==================== 全局变量和函数定义 ====================

// 全局变量
let accountRecords = [];
let accountCategories = [];
let selectedAccountRecords = new Set();
let currentAccountPage = 1;
let accountsPerPage = 20;
let totalAccountPages = 1;
let totalAccountRecords = 0;
let currentSearchParams = null; // 记录当前搜索参数

// 系统日志相关变量
let currentLogPage = 1;
const logsPerPage = 20;
let totalLogPages = 1;
let totalLogs = 0;

// 类别管理相关变量
let editingCategories = [];

// 图表相关变量
let chartInstances = {};
let currentChartType = 'line';

// 类别统计时间维度
let currentCategoryTimeRange = 'all';

// 默认类别数据
const defaultCategories = [
	{
		category_type: '支出',
		category_name: '餐饮',
		subcategories: ['早餐', '午餐', '晚餐', '零食', '水果']
	},
	{
		category_type: '支出', 
		category_name: '交通',
		subcategories: ['公交', '地铁', '出租车', '加油', '停车费']
	},
	{
		category_type: '支出',
		category_name: '购物',
		subcategories: ['服装', '日用品', '电子产品', '家居用品']
	},
	{
		category_type: '支出',
		category_name: '娱乐',
		subcategories: ['电影', '旅游', '游戏', '运动']
	},
	{
		category_type: '支出',
		category_name: '医疗',
		subcategories: ['看病', '药品', '体检']
	},
	{
		category_type: '支出',
		category_name: '教育',
		subcategories: ['学费', '书籍', '培训']
	},
	{
		category_type: '支出',
		category_name: '住房',
		subcategories: ['房租', '房贷', '水电费', '物业费']
	},
	{
		category_type: '支出',
		category_name: '其他',
		subcategories: ['人情往来', '捐赠', '其他']
	},
	{
		category_type: '收入',
		category_name: '工资收入',
		subcategories: ['基本工资', '奖金', '津贴']
	},
	{
		category_type: '收入',
		category_name: '投资收益', 
		subcategories: ['股票', '基金', '理财']
	},
	{
		category_type: '收入',
		category_name: '其他收入',
		subcategories: ['兼职', '退款', '红包']
	}
];

// ==================== 新增：图表配置函数 ====================

// ==================== 新增：所属人管理功能 ====================
let allOwners = ['郭宁', '李佳慧'];

// 加载所属人列表
function loadOwners() {
	console.log('开始加载所属人列表...');
	
	fetch('/api/owners')
		.then(response => {
			console.log('所属人API响应状态:', response.status);
			if (!response.ok) {
				throw new Error(`网络响应不正常: ${response.status}`);
			}
			return response.json();
		})
		.then(data => {
			console.log('收到所属人数据:', data);
			if (data.owners && Array.isArray(data.owners)) {
				// 更新全局所属人列表
				allOwners = [...new Set([...data.owners, '郭宁', '李佳慧'])].sort();
				console.log('设置全局所属人列表:', allOwners);
				
				// 更新所有使用所属人的地方
				updateAllOwnerSelects();
			} else if (data.error) {
				console.error('API返回错误:', data.error);
				// 使用默认所属人列表
				allOwners = ['郭宁', '李佳慧'];
				updateAllOwnerSelects();
			}
		})
		.catch(error => {
			console.error('加载所属人列表失败:', error);
			// 使用默认所属人列表
			allOwners = ['郭宁', '李佳慧'];
			updateAllOwnerSelects();
		});
}

// 新增：更新所有使用所属人的下拉框
function updateAllOwnerSelects() {
	console.log('更新所有所属人下拉框，当前列表:', allOwners);
	
	// 1. 搜索表单的所属人筛选器
	updateOwnerSelect('searchAccountOwner', allOwners, '全部');
	
	// 2. 添加/编辑记账记录表单的所属人
	updateOwnerSelect('accountOwner', allOwners, null, allOwners[0] || '郭宁');
	
	// 3. 统计表单的所属人筛选器
	updateOwnerSelect('statisticsOwner', allOwners, '全部');
	
	// 4. 子类别统计表单的所属人筛选器
	updateOwnerSelect('subcategoryOwner', allOwners, '全部');
	
	// 5. 图表统计的所属人筛选器（如果存在）
	updateOwnerSelect('statisticsOwner', allOwners, '全部'); // 统计模态框中的
	
	console.log('所有所属人下拉框更新完成');
}

// 新增：通用更新所属人下拉框函数
function updateOwnerSelect(selectId, owners, allOption = null, defaultValue = null) {
	const selectElement = document.getElementById(selectId);
	if (!selectElement) {
		console.log(`元素 ${selectId} 不存在，跳过`);
		return;
	}
	
	// 保存当前选中的值
	const currentValue = selectElement.value;
	
	// 清空选项
	selectElement.innerHTML = '';
	
	// 添加"全部"选项（如果需要）
	if (allOption !== null) {
		const option = document.createElement('option');
		option.value = allOption;
		option.textContent = allOption;
		selectElement.appendChild(option);
	}
	
	// 添加所属人选项
	owners.forEach(owner => {
		const option = document.createElement('option');
		option.value = owner;
		option.textContent = owner;
		selectElement.appendChild(option);
	});
	
	// 恢复选中的值或设置默认值
	if (currentValue && owners.includes(currentValue)) {
		selectElement.value = currentValue;
	} else if (defaultValue && owners.includes(defaultValue)) {
		selectElement.value = defaultValue;
	} else if (allOption !== null) {
		selectElement.value = allOption;
	} else if (owners.length > 0) {
		selectElement.value = owners[0];
	}
	
	console.log(`更新 ${selectId} 完成，选中值: ${selectElement.value}`);
}

// 更新所属人筛选器
function updateOwnerFilters() {
	console.log('更新所属人筛选器，当前所属人列表:', allOwners);
	
	const searchOwnerSelect = document.getElementById('searchAccountOwner');
	const accountOwnerSelect = document.getElementById('accountOwner');
	const statisticsOwnerSelect = document.getElementById('statisticsOwner');
	const subcategoryOwnerSelect = document.getElementById('subcategoryOwner');
	
	// 保存当前选中的值
	const currentSearchOwner = searchOwnerSelect ? searchOwnerSelect.value : null;
	const currentAccountOwner = accountOwnerSelect ? accountOwnerSelect.value : null;
	const currentStatisticsOwner = statisticsOwnerSelect ? statisticsOwnerSelect.value : null;
	const currentSubcategoryOwner = subcategoryOwnerSelect ? subcategoryOwnerSelect.value : null;
	
	// 清空选项
	if (searchOwnerSelect) {
		searchOwnerSelect.innerHTML = '<option value="全部">全部</option>';
	}
	if (accountOwnerSelect) {
		accountOwnerSelect.innerHTML = '';
	}
	if (statisticsOwnerSelect) {
		statisticsOwnerSelect.innerHTML = '<option value="全部">全部</option>';
	}
	if (subcategoryOwnerSelect) {
		subcategoryOwnerSelect.innerHTML = '<option value="全部">全部</option>';
	}
	
	// 添加所属人选项
	allOwners.forEach(owner => {
		// 搜索表单
		if (searchOwnerSelect) {
			const option1 = document.createElement('option');
			option1.value = owner;
			option1.textContent = owner;
			searchOwnerSelect.appendChild(option1);
		}
		
		// 记账表单
		if (accountOwnerSelect) {
			const option2 = document.createElement('option');
			option2.value = owner;
			option2.textContent = owner;
			accountOwnerSelect.appendChild(option2);
		}
		
		// 统计表单
		if (statisticsOwnerSelect) {
			const option3 = document.createElement('option');
			option3.value = owner;
			option3.textContent = owner;
			statisticsOwnerSelect.appendChild(option3);
		}
		
		// 子类别统计表单
		if (subcategoryOwnerSelect) {
			const option4 = document.createElement('option');
			option4.value = owner;
			option4.textContent = owner;
			subcategoryOwnerSelect.appendChild(option4);
		}
	});
	
	// 恢复之前选中的值
	if (searchOwnerSelect && currentSearchOwner && currentSearchOwner !== '全部') {
		searchOwnerSelect.value = currentSearchOwner;
	}
	if (accountOwnerSelect && currentAccountOwner) {
		accountOwnerSelect.value = currentAccountOwner;
	}
	if (statisticsOwnerSelect && currentStatisticsOwner && currentStatisticsOwner !== '全部') {
		statisticsOwnerSelect.value = currentStatisticsOwner;
	}
	if (subcategoryOwnerSelect && currentSubcategoryOwner && currentSubcategoryOwner !== '全部') {
		subcategoryOwnerSelect.value = currentSubcategoryOwner;
	}
	
	console.log('所属人筛选器更新完成');
}

// 更新用户权限控制
function updateOwnerPermissions() {
	// 获取用户权限信息
	fetch('/api/user/permissions')
		.then(response => {
			if (!response.ok) {
				throw new Error('获取权限失败');
			}
			return response.json();
		})
		.then(data => {
			// 根据用户权限过滤所属人选项
			const userAllowedOwners = data.allowed_owners || allOwners;
			
			// 更新所有所属人筛选器，只显示用户有权限查看的所属人
			updateOwnerFiltersWithPermissions(userAllowedOwners);
			
			// 如果是受限用户，自动设置筛选条件
			if (data.role === 'user' && userAllowedOwners.length === 1) {
				const defaultOwner = userAllowedOwners[0];
				document.getElementById('searchAccountOwner').value = defaultOwner;
				document.getElementById('statisticsOwner').value = defaultOwner;
				// 自动应用筛选
				searchAccountRecords();
			}
		})
		.catch(error => {
			console.error('获取用户权限失败:', error);
			// 默认显示所有所属人
			updateOwnerFiltersWithPermissions(allOwners);
		});
}

// 根据权限更新所属人筛选器
function updateOwnerFiltersWithPermissions(allowedOwners) {
	const searchOwnerSelect = document.getElementById('searchAccountOwner');
	const accountOwnerSelect = document.getElementById('accountOwner');
	const statisticsOwnerSelect = document.getElementById('statisticsOwner');
	const subcategoryOwnerSelect = document.getElementById('subcategoryOwner');
	
	// 更新搜索表单的所属人筛选器
	searchOwnerSelect.innerHTML = '<option value="全部">全部</option>';
	allowedOwners.forEach(owner => {
		const option = document.createElement('option');
		option.value = owner;
		option.textContent = owner;
		searchOwnerSelect.appendChild(option);
	});
	
	// 更新记账表单的所属人选项
	accountOwnerSelect.innerHTML = '';
	allowedOwners.forEach(owner => {
		const option = document.createElement('option');
		option.value = owner;
		option.textContent = owner;
		accountOwnerSelect.appendChild(option);
	});
	
	// 设置默认值
	if (allowedOwners.length > 0) {
		accountOwnerSelect.value = allowedOwners[0];
	}
	
	// 更新统计表单的所属人筛选器
	statisticsOwnerSelect.innerHTML = '<option value="全部">全部</option>';
	allowedOwners.forEach(owner => {
		const option = document.createElement('option');
		option.value = owner;
		option.textContent = owner;
		statisticsOwnerSelect.appendChild(option);
	});
	
	// 更新子类别统计表单的所属人筛选器
	if (subcategoryOwnerSelect) {
		subcategoryOwnerSelect.innerHTML = '<option value="全部">全部</option>';
		allowedOwners.forEach(owner => {
			const option = document.createElement('option');
			option.value = owner;
			option.textContent = owner;
			subcategoryOwnerSelect.appendChild(option);
		});
	}
}

// 打开所属人管理模态框
function openOwnersManagementModal() {
	const modal = new bootstrap.Modal(document.getElementById('ownersManagementModal'));
	modal.show();
	
	// 加载所属人列表
	loadOwnersForManagement();
}

// 加载所属人列表用于管理
function loadOwnersForManagement() {
	fetch('/api/owners')
		.then(response => {
			if (!response.ok) {
				throw new Error('网络响应不正常');
			}
			return response.json();
		})
		.then(data => {
			// 更新全局列表
			if (data.owners && Array.isArray(data.owners)) {
				allOwners = [...new Set([...data.owners, '郭宁', '李佳慧'])].sort();
			}
			renderOwnersList(data.owners || []);
		})
		.catch(error => {
			console.error('加载所属人列表失败:', error);
			renderOwnersList(allOwners);
		});
}


// 渲染所属人列表
function renderOwnersList(owners) {
	const ownersListContainer = document.getElementById('ownersList');
	ownersListContainer.innerHTML = '';
	
	// 使用全局列表而不是传入的列表
	const displayOwners = allOwners.length > 0 ? allOwners : owners;
	
	if (displayOwners.length === 0) {
		ownersListContainer.innerHTML = '<div class="text-center py-4 text-muted">暂无所属人数据</div>';
		return;
	}
	
	displayOwners.forEach(owner => {
		const ownerItem = document.createElement('div');
		ownerItem.className = 'card mb-2';
		ownerItem.innerHTML = `
			<div class="card-body py-2">
				<div class="d-flex justify-content-between align-items-center">
					<div class="owner-info">
						<span class="owner-badge owner-userA">${owner}</span>
						${owner === '郭宁' || owner === '李佳慧' ? '<span class="badge bg-info ms-2">默认</span>' : ''}
					</div>
					<div class="owner-actions">
						${owner !== '郭宁' && owner !== '李佳慧' ? 
							`<button class="btn btn-sm btn-outline-danger" onclick="deleteOwner('${owner}')">
								<i class="bi bi-trash"></i>
							</button>` : 
							'<span class="text-muted small">系统默认</span>'
						}
					</div>
				</div>
			</div>
		`;
		ownersListContainer.appendChild(ownerItem);
	});
}

// 添加新的所属人
function addNewOwner() {
	const newOwnerInput = document.getElementById('newOwnerName');
	const newOwner = newOwnerInput.value.trim();
	
	if (!newOwner) {
		showAlert('请输入所属人名称', 'error');
		return;
	}
	
	if (newOwner.length > 20) {
		showAlert('所属人名称不能超过20个字符', 'error');
		return;
	}
	
	// 检查是否已存在
	if (allOwners.includes(newOwner)) {
		showAlert('该所属人已存在', 'error');
		return;
	}
	
	console.log('正在添加所属人:', newOwner);
	
	fetch('/api/owners', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ owner: newOwner })
	})
	.then(response => {
		console.log('添加所属人响应状态:', response.status);
		if (!response.ok) {
			return response.json().then(errorData => {
				throw new Error(errorData.message || `HTTP错误: ${response.status}`);
			});
		}
		return response.json();
	})
	.then(data => {
		console.log('添加所属人响应数据:', data);
		if (data.success) {
			showAlert('所属人添加成功！', 'success');
			newOwnerInput.value = '';
			
			// 立即将新所属人添加到全局列表
			allOwners.push(newOwner);
			allOwners.sort((a, b) => a.localeCompare(b));
			
			console.log('更新后所属人列表:', allOwners);
			
			// 立即更新所有下拉框
			updateAllOwnerSelects();
			
			// 重新加载管理界面的列表
			loadOwnersForManagement();
			
			console.log('所属人添加完成，已更新所有下拉框');
			
			// 额外：如果有打开的模态框，可能需要特殊处理
			const accountModal = bootstrap.Modal.getInstance(document.getElementById('accountRecordModal'));
			if (accountModal) {
				// 如果添加记录模态框是打开的，重新加载其所属人下拉框
				updateOwnerSelect('accountOwner', allOwners, null, newOwner);
			}
		} else {
			throw new Error(data.message || '添加失败');
		}
	})
	.catch(error => {
		console.error('添加所属人失败:', error);
		showAlert('添加所属人失败: ' + error.message, 'error');
	});
}
// 删除所属人
function deleteOwner(ownerName) {
	showConfirm(`确定要删除所属人 "${ownerName}" 吗？`, function() {
		fetch(`/api/owners/${encodeURIComponent(ownerName)}`, {
			method: 'DELETE'
		})
		.then(response => {
			if (!response.ok) {
				throw new Error('删除失败');
			}
			return response.json();
		})
		.then(data => {
			if (data.success) {
				showAlert('所属人删除成功！', 'success');
				
				// 从全局列表中删除
				const index = allOwners.indexOf(ownerName);
				if (index > -1) {
					allOwners.splice(index, 1);
				}
				
				// 立即更新所有下拉框
				updateAllOwnerSelects();
				
				// 重新加载管理界面的列表
				loadOwnersForManagement();
			} else {
				throw new Error(data.message || '删除失败');
			}
		})
		.catch(error => {
			console.error('删除所属人失败:', error);
			showAlert('删除所属人失败: ' + error.message, 'error');
		});
	});
}

// ==================== 新增：日历视图功能 ====================

// 打开日历视图模态框
function openCalendarModal() {
	const modal = new bootstrap.Modal(document.getElementById('calendarModal'));
	modal.show();
	
	// 设置默认日期为当前年月
	const today = new Date();
	const year = today.getFullYear();
	const month = today.getMonth() + 1;
	document.getElementById('calendarMonth').value = `${year}-${month.toString().padStart(2, '0')}`;
	
	// 加载日历数据
	loadCalendarData();
}

// 加载日历数据
function loadCalendarData() {
	const dateInput = document.getElementById('calendarMonth').value;
	const [year, month] = dateInput.split('-').map(Number);
	const owner = document.getElementById('calendarOwner').value;
	const viewMode = document.getElementById('calendarViewMode').value;
	
	const refreshBtn = document.getElementById('refreshCalendarBtn');
	const originalText = refreshBtn.innerHTML;
	refreshBtn.innerHTML = '<i class="bi bi-hourglass-split me-1"></i>加载中...';
	refreshBtn.disabled = true;
	
	// 构建查询参数
	const params = new URLSearchParams({
		year: year,
		month: month,
		owner: owner
	});
	
	fetch(`/api/account/calendar?${params}`)
		.then(response => {
			if (!response.ok) {
				throw new Error('获取日历数据失败');
			}
			return response.json();
		})
		.then(data => {
			if (data.success) {
				renderCalendar(data, viewMode);
				document.getElementById('calendarTitle').textContent = `日历视图 - ${data.month_name}`;
				
				// 更新所属人下拉框
				updateOwnerSelect('calendarOwner', data.owners, '全部', owner);
			} else {
				throw new Error(data.message || '获取日历数据失败');
			}
		})
		.catch(error => {
			console.error('加载日历数据失败:', error);
			showAlert('加载日历数据失败: ' + error.message, 'error');
		})
		.finally(() => {
			refreshBtn.innerHTML = originalText;
			refreshBtn.disabled = false;
		});
}

// 渲染日历
function renderCalendar(data, viewMode) {
	const header = document.getElementById('calendarHeader');
	const body = document.getElementById('calendarBody');
	
	// 清空现有内容
	header.innerHTML = '';
	body.innerHTML = '';
	
	// 渲染表头（星期几）
	const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
	weekdays.forEach(day => {
		const th = document.createElement('th');
		th.textContent = day;
		th.style.width = '14.28%';
		header.appendChild(th);
	});
	
	// 创建日历表格
	const firstDay = new Date(data.year, data.month - 1, 1);
	const lastDay = new Date(data.year, data.month, 0);
	const daysInMonth = lastDay.getDate();
	const firstWeekday = firstDay.getDay(); // 0 = 周日, 1 = 周一, ..., 6 = 周六
	
	// 将日历数据转换为字典以便快速查找
	const calendarDict = {};
	data.calendar_data.forEach(dayData => {
		calendarDict[dayData.date] = dayData;
	});
	
	// 创建日历行
	let dayCounter = 1;
	for (let week = 0; week < 6; week++) {
		const tr = document.createElement('tr');
		
		for (let weekday = 0; weekday < 7; weekday++) {
			const td = document.createElement('td');
			td.className = 'calendar-day'; // 类名直接应用到 td


			
			if ((week === 0 && weekday < firstWeekday) || dayCounter > daysInMonth) {
				// 空单元格
				td.innerHTML = '';
			} else {
				const dateStr = `${data.year}-${data.month.toString().padStart(2, '0')}-${dayCounter.toString().padStart(2, '0')}`;
				const dayData = calendarDict[dateStr];
				const today = new Date();
				const isToday = today.getFullYear() === data.year && 
							   today.getMonth() + 1 === data.month && 
							   today.getDate() === dayCounter;
				const isWeekend = weekday === 0 || weekday === 6;
				
				if (isToday) td.classList.add('calendar-today');
				if (isWeekend) td.classList.add('calendar-weekend');
				
				// 添加日期编号
				const dayNumber = document.createElement('div');
				dayNumber.className = 'calendar-day-number';
				dayNumber.textContent = dayCounter;
				td.appendChild(dayNumber);
				
				// 添加日期内容
				const contentDiv = document.createElement('div');
				contentDiv.className = 'calendar-day-content';
				
				if (dayData) {
					if (viewMode === 'detailed') {
						// 详细模式：显示每个所属人的详细数据
						contentDiv.innerHTML = renderDetailedDayContent(dayData);
					} else {
						// 汇总模式：只显示汇总数据
						contentDiv.innerHTML = renderSummaryDayContent(dayData);
					}
				} else {
					// 没有数据
					contentDiv.innerHTML = '<div class="calendar-empty">无记录</div>';
				}
				
				td.appendChild(contentDiv);
				dayCounter++;
			}
			
			tr.appendChild(td);
		}
		
		body.appendChild(tr);
		
		// 如果已经显示完所有天数，跳出循环
		if (dayCounter > daysInMonth) {
			break;
		}
	}
	
	// 更新月度统计
	updateMonthlyStats(data);
}

// 渲染详细日期内容
<!-- 渲染详细日期内容 -->
function renderDetailedDayContent(dayData) {
	let html = '';
	
	// 按所属人排序
	const owners = Object.keys(dayData.owners).sort();
	
	if (owners.length === 0) {
		html = '<div class="calendar-empty">无记录</div>';
	} else {
		owners.forEach(owner => {
			const ownerData = dayData.owners[owner];
			// 移除净收支，只显示收入和支出
			html += `
				<div class="calendar-owner-item" style="display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; margin: 2px 0;">
					<span class="calendar-owner-name" style="font-weight: 600; font-size: 0.75rem; margin-bottom: 2px;">${owner}</span>
					<div style="display: flex; flex-direction: column; align-items: center; gap: 1px;">
						${ownerData.income > 0 ? `<span class="calendar-amount calendar-income" style="font-size: 0.7rem;">+${ownerData.income.toFixed(2)}</span>` : ''}
						${ownerData.expense > 0 ? `<span class="calendar-amount calendar-expense" style="font-size: 0.7rem;">-${ownerData.expense.toFixed(2)}</span>` : ''}
					</div>
				</div>
			`;
		});
	}
	
	return html;
}

<!-- 渲染汇总日期内容 -->
function renderSummaryDayContent(dayData) {
	const summary = dayData.summary;
	
	let html = '';
	
	if (summary.owner_count > 0) {
		html = `
			<div class="calendar-summary" style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%;">
				<div style="display: flex; flex-direction: column; align-items: center; gap: 3px;">
					${summary.total_income > 0 ? `<div class="calendar-summary-income" style="font-size: 0.75rem;">+${summary.total_income.toFixed(2)}</div>` : ''}
					${summary.total_expense > 0 ? `<div class="calendar-summary-expense" style="font-size: 0.75rem;">-${summary.total_expense.toFixed(2)}</div>` : ''}
				</div>
				<div class="calendar-summary-count" style="font-size: 0.65rem; color: var(--text-secondary); margin-top: 3px;">
					${summary.owner_count}人
				</div>
			</div>
		`;
	} else {
		html = '<div class="calendar-empty" style="display: flex; align-items: center; justify-content: center; height: 100%;">无记录</div>';
	}
	
	return html;
}

// 更新月度统计
function updateMonthlyStats(data) {
	const container = document.getElementById('monthlyStats');
	
	// 计算月度汇总
	let totalIncome = 0;
	let totalExpense = 0;
	let totalRecords = 0;
	let ownerStats = {};
	
	data.calendar_data.forEach(dayData => {
		totalIncome += dayData.summary.total_income;
		totalExpense += dayData.summary.total_expense;
		totalRecords += dayData.summary.owner_count;
		
		// 统计每个所属人的数据
		Object.entries(dayData.owners).forEach(([owner, stats]) => {
			if (!ownerStats[owner]) {
				ownerStats[owner] = {
					income: 0,
					expense: 0,
					records: 0
				};
			}
			ownerStats[owner].income += stats.income;
			ownerStats[owner].expense += stats.expense;
			ownerStats[owner].records += 1;
		});
	});
	
	const netAmount = totalIncome - totalExpense;
	
	// 获取主要所属人（按总金额排序）
	const topOwners = Object.entries(ownerStats)
		.sort((a, b) => {
			const aTotal = a[1].income + a[1].expense;
			const bTotal = b[1].income + b[1].expense;
			return bTotal - aTotal;
		})
		.slice(0, 3);
	
	container.innerHTML = `
		<div class="col-md-3">
			<div class="stats-card">
				<div class="stats-label">月度总收入</div>
				<div class="stats-number text-success">${totalIncome.toFixed(2)}</div>
				<div class="stats-label">${data.month_name}收入总额</div>
			</div>
		</div>
		<div class="col-md-3">
			<div class="stats-card">
				<div class="stats-label">月度总支出</div>
				<div class="stats-number text-danger">${totalExpense.toFixed(2)}</div>
				<div class="stats-label">${data.month_name}支出总额</div>
			</div>
		</div>
		<div class="col-md-3">
			<div class="stats-card">
				<div class="stats-label">月度净收入</div>
				<div class="stats-number ${netAmount >= 0 ? 'positive' : 'negative'}">${netAmount.toFixed(2)}</div>
				<div class="stats-label">收入 - 支出</div>
			</div>
		</div>
		<div class="col-md-3">
			<div class="stats-card">
				<div class="stats-label">总记录数</div>
				<div class="stats-number text-primary">${totalRecords}</div>
				<div class="stats-label">${data.month_name}记录总数</div>
			</div>
		</div>
	`;
	
	// 如果有主要所属人数据，添加额外的统计卡片
	if (topOwners.length > 0) {
		let ownerStatsHtml = '';
		topOwners.forEach(([owner, stats]) => {
			const ownerNet = stats.income - stats.expense;
			ownerStatsHtml += `
				<div class="col-md-4">
					<div class="stats-card">
						<div class="stats-label">${owner}</div>
						<div class="stats-number">${(stats.income + stats.expense).toFixed(2)}</div>
						<div class="stats-label">
							<span class="text-success">+${stats.income.toFixed(2)}</span> / 
							<span class="text-danger">-${stats.expense.toFixed(2)}</span>
						</div>
					</div>
				</div>
			`;
		});
		
		container.innerHTML += `
			<div class="col-12 mt-3">
				<div class="card">
					<div class="card-body">
						<h6 class="card-title">主要所属人统计</h6>
						<div class="row">
							${ownerStatsHtml}
						</div>
					</div>
				</div>
			</div>
		`;
	}
}

// 导出日历数据
function exportCalendarData() {
	const dateInput = document.getElementById('calendarMonth').value;
	const [year, month] = dateInput.split('-').map(Number);
	const owner = document.getElementById('calendarOwner').value;
	
	// 构建查询参数
	const params = new URLSearchParams({
		year: year,
		month: month,
		owner: owner,
		export: 'true'
	});
	
	// 在新窗口打开导出链接（需要后端支持）
	window.open(`/api/account/calendar/export?${params}`, '_blank');
	showAlert('日历数据导出任务已开始，请稍候...', 'success');
}

// ==================== 新增：所属人深度统计功能 ====================

// 打开所属人深度统计模态框
function openOwnerDeepStatisticsModal() {
	const modal = new bootstrap.Modal(document.getElementById('ownerDeepStatisticsModal'));
	modal.show();
	
	// 设置默认日期
	const today = new Date().toISOString().split('T')[0];
	const oneYearAgo = new Date();
	oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
	
	document.getElementById('ownerStatsStartDate').value = oneYearAgo.toISOString().split('T')[0];
	document.getElementById('ownerStatsEndDate').value = today;
	
	// 加载所属人统计
	loadOwnerDeepStatistics();
}

// 加载所属人深度统计
function loadOwnerDeepStatistics() {
	const startDate = document.getElementById('ownerStatsStartDate').value;
	const endDate = document.getElementById('ownerStatsEndDate').value;
	const statType = document.getElementById('ownerStatsType').value;
	
	if (!startDate || !endDate) {
		showAlert('请选择开始日期和结束日期', 'error');
		return;
	}
	
	if (startDate > endDate) {
		showAlert('开始日期不能晚于结束日期', 'error');
		return;
	}
	
	const calculateBtn = document.getElementById('calculateOwnerStatsBtn');
	const originalText = calculateBtn.innerHTML;
	calculateBtn.innerHTML = '<i class="bi bi-hourglass-split me-1"></i>计算中...';
	calculateBtn.disabled = true;
	
	// 构建查询参数
	const params = new URLSearchParams({
		start_date: startDate,
		end_date: endDate,
		type: statType
	});
	
	fetch(`/api/account/statistics/by_owner?${params}`)
		.then(response => {
			if (!response.ok) {
				throw new Error('统计计算失败');
			}
			return response.json();
		})
		.then(data => {
			if (data.success) {
				renderOwnerDeepStatistics(data);
				document.getElementById('exportOwnerStatsBtn').style.display = 'inline-block';
			} else {
				throw new Error(data.message || '统计计算失败');
			}
		})
		.catch(error => {
			console.error('计算所属人统计失败:', error);
			showAlert('计算所属人统计失败: ' + error.message, 'error');
		})
		.finally(() => {
			calculateBtn.innerHTML = originalText;
			calculateBtn.disabled = false;
		});
}

// 渲染所属人深度统计
function renderOwnerDeepStatistics(data) {
	const tableBody = document.getElementById('ownerStatisticsTableBody');
	const summaryBody = document.getElementById('ownerStatisticsSummaryBody');
	
	// 清空现有内容
	tableBody.innerHTML = '';
	summaryBody.innerHTML = '';
	
	if (!data.statistics || Object.keys(data.statistics).length === 0) {
		tableBody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-muted">暂无统计数据</td></tr>';
		return;
	}
	
	// 渲染详细统计表格
	let tableHtml = '';
	data.periods.forEach(period => {
		data.owners.forEach(owner => {
			const stats = data.statistics[period][owner];
			const netAmount = stats['净收入'];
			const netClass = netAmount >= 0 ? 'positive' : 'negative';
			
			tableHtml += `
				<tr>
					<td>${period}</td>
					<td><span class="owner-badge owner-userA">${owner}</span></td>
					<td>${stats['支出']['count']}</td>
					<td class="negative">${stats['支出']['amount'].toFixed(2)}</td>
					<td>${stats['收入']['count']}</td>
					<td class="positive">${stats['收入']['amount'].toFixed(2)}</td>
					<td class="${netClass}">${netAmount.toFixed(2)}</td>
				</tr>
			`;
		});
	});
	
	tableBody.innerHTML = tableHtml;
	
	// 渲染汇总统计
	let summaryHtml = '';
	data.owners.forEach(owner => {
		const totals = data.totals[owner];
		const netAmount = totals['净收入'];
		const netClass = netAmount >= 0 ? 'positive' : 'negative';
		
		summaryHtml += `
			<tr>
				<td><span class="owner-badge owner-userA">${owner}</span></td>
				<td>${totals['支出']['count']}</td>
				<td class="negative">${totals['支出']['amount'].toFixed(2)}</td>
				<td>${totals['收入']['count']}</td>
				<td class="positive">${totals['收入']['amount'].toFixed(2)}</td>
				<td class="${netClass}">${netAmount.toFixed(2)}</td>
				<td>${(totals['支出']['amount'] + totals['收入']['amount']).toFixed(2)}</td>
			</tr>
		`;
	});
	
	summaryBody.innerHTML = summaryHtml;
	
	// 更新标题
	const title = document.getElementById('ownerStatsTitle');
	title.textContent = `所属人深度统计 - ${data.filters.start_date} 至 ${data.filters.end_date} `;
	
	// 保存当前查询条件用于导出
	window.currentOwnerStatsQuery = {
		start_date: data.filters.start_date,
		end_date: data.filters.end_date,
		type: data.filters.type
	};
}

// 打开所属人对比统计模态框
function openOwnerComparisonModal() {
	const modal = new bootstrap.Modal(document.getElementById('ownerComparisonModal'));
	modal.show();
	
	// 设置默认日期
	const today = new Date().toISOString().split('T')[0];
	const oneYearAgo = new Date();
	oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
	
	document.getElementById('ownerCompareStartDate').value = oneYearAgo.toISOString().split('T')[0];
	document.getElementById('ownerCompareEndDate').value = today;
	
	// 加载所属人对比统计
	loadOwnerComparisonStatistics();
}

// 加载所属人对比统计
function loadOwnerComparisonStatistics() {
	const startDate = document.getElementById('ownerCompareStartDate').value;
	const endDate = document.getElementById('ownerCompareEndDate').value;
	
	if (!startDate || !endDate) {
		showAlert('请选择开始日期和结束日期', 'error');
		return;
	}
	
	if (startDate > endDate) {
		showAlert('开始日期不能晚于结束日期', 'error');
		return;
	}
	
	const calculateBtn = document.getElementById('calculateOwnerCompareBtn');
	const originalText = calculateBtn.innerHTML;
	calculateBtn.innerHTML = '<i class="bi bi-hourglass-split me-1"></i>计算中...';
	calculateBtn.disabled = true;
	
	// 构建查询参数
	const params = new URLSearchParams({
		start_date: startDate,
		end_date: endDate
	});
	
	fetch(`/api/account/statistics/owner_comparison?${params}`)
		.then(response => {
			if (!response.ok) {
				throw new Error('统计计算失败');
			}
			return response.json();
		})
		.then(data => {
			if (data.success) {
				renderOwnerComparisonStatistics(data);
				document.getElementById('exportOwnerCompareBtn').style.display = 'inline-block';
			} else {
				throw new Error(data.message || '统计计算失败');
			}
		})
		.catch(error => {
			console.error('计算所属人对比统计失败:', error);
			showAlert('计算所属人对比统计失败: ' + error.message, 'error');
		})
		.finally(() => {
			calculateBtn.innerHTML = originalText;
			calculateBtn.disabled = false;
		});
}

// 渲染所属人对比统计
function renderOwnerComparisonStatistics(data) {
	// 渲染类别对比
	renderCategoryComparison(data.category_stats, data.owners);
	
	// 渲染月度对比图表
	renderMonthlyComparisonChart(data.monthly_stats, data.owners);
	
	// 渲染汇总统计
	renderOwnerComparisonSummary(data.totals, data.owners);
	
	// 保存当前查询条件用于导出
	window.currentOwnerCompareQuery = {
		start_date: data.filters.start_date,
		end_date: data.filters.end_date
	};
}

// 渲染类别对比表格
function renderCategoryComparison(categoryStats, owners) {
	const tableBody = document.getElementById('categoryComparisonBody');
	tableBody.innerHTML = '';
	
	if (!categoryStats || Object.keys(categoryStats).length === 0) {
		tableBody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-muted">暂无类别统计数据</td></tr>';
		return;
	}
	
	let tableHtml = '';
	Object.keys(categoryStats).forEach(category => {
		const categoryData = categoryStats[category];
		
		// 计算类别总计
		let totalExpense = 0;
		let totalIncome = 0;
		
		owners.forEach(owner => {
			if (categoryData[owner]) {
				totalExpense += categoryData[owner]['支出'] || 0;
				totalIncome += categoryData[owner]['收入'] || 0;
			}
		});
		
		tableHtml += `<tr><td colspan="${owners.length + 3}" class="bg-light"><strong>${category}</strong></td></tr>`;
		
		// 支出行
		tableHtml += '<tr><td>支出</td>';
		owners.forEach(owner => {
			const amount = categoryData[owner] ? (categoryData[owner]['支出'] || 0) : 0;
			const percentage = totalExpense > 0 ? ((amount / totalExpense) * 100).toFixed(1) : '0.0';
			tableHtml += `<td class="negative">${amount.toFixed(2)}<br><small class="text-muted">${percentage}%</small></td>`;
		});
		tableHtml += `<td class="negative">${totalExpense.toFixed(2)}</td></tr>`;
		
		// 收入行
		tableHtml += '<tr><td>收入</td>';
		owners.forEach(owner => {
			const amount = categoryData[owner] ? (categoryData[owner]['收入'] || 0) : 0;
			const percentage = totalIncome > 0 ? ((amount / totalIncome) * 100).toFixed(1) : '0.0';
			tableHtml += `<td class="positive">${amount.toFixed(2)}<br><small class="text-muted">${percentage}%</small></td>`;
		});
		tableHtml += `<td class="positive">${totalIncome.toFixed(2)}</td></tr>`;
	});
	
	tableBody.innerHTML = tableHtml;
}

// 渲染月度对比图表
function renderMonthlyComparisonChart(monthlyStats, owners) {
	const ctx = document.getElementById('monthlyComparisonChart').getContext('2d');
	
	// 准备数据
	const months = Object.keys(monthlyStats).sort();
	const datasets = [];
	
	// 为每个所属人创建数据集
	owners.forEach((owner, index) => {
		const incomeData = months.map(month => monthlyStats[month][owner] ? monthlyStats[month][owner]['收入'] : 0);
		const expenseData = months.map(month => monthlyStats[month][owner] ? monthlyStats[month][owner]['支出'] : 0);
		const netData = months.map(month => monthlyStats[month][owner] ? monthlyStats[month][owner]['净收入'] : 0);
		
		// 收入数据集
		datasets.push({
			label: `${owner} - 收入`,
			data: incomeData,
			borderColor: `hsl(${index * 60}, 70%, 50%)`,
			backgroundColor: `hsla(${index * 60}, 70%, 50%, 0.1)`,
			fill: false,
			tension: 0.4
		});
		
		// 支出数据集
		datasets.push({
			label: `${owner} - 支出`,
			data: expenseData,
			borderColor: `hsl(${index * 60 + 30}, 70%, 50%)`,
			backgroundColor: `hsla(${index * 60 + 30}, 70%, 50%, 0.1)`,
			fill: false,
			tension: 0.4,
			borderDash: [5, 5]
		});
	});
	
	// 销毁现有图表
	if (chartInstances.monthlyComparison) {
		chartInstances.monthlyComparison.destroy();
	}
	
	// 创建新图表
	chartInstances.monthlyComparison = new Chart(ctx, {
		type: 'line',
		data: {
			labels: months,
			datasets: datasets
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			plugins: {
				title: {
					display: true,
					text: '所属人月度收支对比',
					color: '#212529',
					font: {
						size: 16
					}
				},
				legend: {
					labels: {
						color: '#212529'
					}
				},
				tooltip: {
					callbacks: {
						label: function(context) {
							return `${context.dataset.label}: ¥${context.parsed.y.toLocaleString()}`;
						}
					}
				}
			},
			scales: {
				x: {
					grid: {
						color: 'rgba(0, 0, 0, 0.1)'
					},
					ticks: {
						color: '#6c757d'
					}
				},
				y: {
					grid: {
						color: 'rgba(0, 0, 0, 0.1)'
					},
					ticks: {
						color: '#6c757d',
						callback: function(value) {
							return '¥' + value.toLocaleString();
						}
					}
				}
			}
		}
	});
}

// 渲染所属人对比汇总
function renderOwnerComparisonSummary(totals, owners) {
	const tableBody = document.getElementById('ownerComparisonSummaryBody');
	tableBody.innerHTML = '';
	
	let tableHtml = '';
	owners.forEach(owner => {
		const ownerData = totals[owner];
		const netAmount = ownerData['净收入'];
		const netClass = netAmount >= 0 ? 'positive' : 'negative';
		
		tableHtml += `
			<tr>
				<td><span class="owner-badge owner-userA">${owner}</span></td>
				<td>${ownerData['记录数']}</td>
				<td class="negative">${ownerData['支出'].toFixed(2)}</td>
				<td class="positive">${ownerData['收入'].toFixed(2)}</td>
				<td class="${netClass}">${netAmount.toFixed(2)}</td>
				<td>${ownerData['支出占比'].toFixed(1)}%</td>
				<td>${ownerData['收入占比'].toFixed(1)}%</td>
				<td>${(ownerData['支出'] + ownerData['收入']).toFixed(2)}</td>
			</tr>
		`;
	});
	
	tableBody.innerHTML = tableHtml;
}

// 获取类别图表配置选项
function getCategoryChartOptions(title, chartType = currentChartType) {
	const isPieChart = chartType === 'pie';
	const isLineChart = chartType === 'line';
	
	// 如果是折线图，转换为柱状图（类别数据不适合折线图）
	const effectiveChartType = isLineChart ? 'bar' : chartType;
	const isEffectivePie = effectiveChartType === 'pie';
	
	return {
		responsive: true,
		maintainAspectRatio: false,
		plugins: {
			title: {
				display: true,
				text: title,
				color: '#212529',
				font: {
					size: 16
				}
			},
			legend: {
				labels: {
					color: '#212529',
					font: {
						size: 12
					}
				},
				position: 'right'
			},
			tooltip: {
				callbacks: {
					label: function(context) {
						const label = context.dataset.label || context.label || '';
						let value = context.parsed;
						
						// 对于饼图，使用context.raw
						if (isEffectivePie) {
							value = context.raw;
						}
						
						// 对于折线图/柱状图，使用context.parsed.y或context.parsed
						if (isLineChart || effectiveChartType === 'bar') {
							value = context.parsed ? context.parsed.y : context.raw;
						}
						
						return `${label}: ¥${parseFloat(value || 0).toLocaleString()}`;
					}
				}
			}
		},
		// 只有非饼图才需要坐标轴
		scales: !isEffectivePie ? {
			x: {
				grid: {
					color: 'rgba(0, 0, 0, 0.1)'
				},
				ticks: {
					color: '#6c757d',
					font: {
						size: 11
					}
				}
			},
			y: {
				grid: {
					color: 'rgba(0, 0, 0, 0.1)'
				},
				ticks: {
					color: '#6c757d',
					font: {
						size: 11
					},
					callback: function(value) {
						return '¥' + value.toLocaleString();
					}
				}
			}
		} : undefined
	};
}

// 获取对比图表配置选项
function getComparisonChartOptions(title) {
	return {
		responsive: true,
		maintainAspectRatio: false,
		plugins: {
			title: {
				display: true,
				text: title,
				color: '#212529',
				font: {
					size: 16
				}
			},
			legend: {
				labels: {
					color: '#212529'
				}
			},
			tooltip: {
				callbacks: {
					label: function(context) {
						return `${context.dataset.label}: ¥${context.parsed.y.toLocaleString()}`;
					}
				}
			}
		},
		scales: {
			x: {
				grid: {
					color: 'rgba(0, 0, 0, 0.1)'
				},
				ticks: {
					color: '#6c757d'
				}
			},
			y: {
				grid: {
					color: 'rgba(0, 0, 0, 0.1)'
				},
				ticks: {
					color: '#6c757d',
					callback: function(value) {
						return '¥' + value.toLocaleString();
					}
				}
			}
		}
	};
}

// 自定义提示框函数
function showAlert(message, type = 'info') {
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
	
	const modalElement = document.getElementById('customAlertModal');
	const messageElement = document.getElementById('customAlertMessage');
	const titleElement = document.getElementById('customAlertLabel');
	
	messageElement.textContent = message;
	
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
	
	const originalFooter = footerElement.innerHTML;
	
	footerElement.innerHTML = `
		<button type="button" class="btn btn-secondary" id="cancelActionBtn">取消</button>
		<button type="button" class="btn btn-danger" id="confirmActionBtn">确定</button>
	`;
	
	const modal = new bootstrap.Modal(modalElement);
	modal.show();
	
	document.getElementById('confirmActionBtn').addEventListener('click', function() {
		modal.hide();
		setTimeout(() => {
			footerElement.innerHTML = originalFooter;
		}, 300);
		if (confirmCallback) confirmCallback();
	});
	
	document.getElementById('cancelActionBtn').addEventListener('click', function() {
		modal.hide();
		setTimeout(() => {
			footerElement.innerHTML = originalFooter;
		}, 300);
		if (cancelCallback) cancelCallback();
	});
	
	modalElement.addEventListener('hidden.bs.modal', function() {
		footerElement.innerHTML = originalFooter;
	});
}

// 加载用户信息
function loadUserInfo() {
	fetch('/api/user_info')
		.then(response => {
			if (!response.ok) {
				throw new Error('获取用户信息失败');
			}
			return response.json();
		})
		.then(data => {
			document.getElementById('currentUserDisplay').textContent = data.username;
		})
		.catch(error => {
			console.error('获取用户信息失败:', error);
		});
}

// 加载记账记录
// 数据缓存
const dataCache = {
	cache: new Map(),
	maxSize: 100,
	
	set(key, data) {
		if (this.cache.size >= this.maxSize) {
			const firstKey = this.cache.keys().next().value;
			this.cache.delete(firstKey);
		}
		this.cache.set(key, {
			data: data,
			timestamp: Date.now()
		});
	},
	
	get(key, maxAge = 5 * 60 * 1000) { // 5分钟缓存
		const item = this.cache.get(key);
		if (!item) return null;
		
		if (Date.now() - item.timestamp > maxAge) {
			this.cache.delete(key);
			return null;
		}
		
		return item.data;
	},
	
	clear() {
		this.cache.clear();
	}
};


// 添加性能监控
function setupPerformanceMonitoring() {
	// 监控页面加载时间
	const loadStartTime = performance.now();
	
	window.addEventListener('load', () => {
		const loadTime = performance.now() - loadStartTime;
		console.log(`页面加载完成，耗时: ${loadTime.toFixed(2)}ms`);
		
		if (loadTime > 3000) {
			console.warn('页面加载较慢，建议优化');
		}
	});
	
	// 监控API响应时间
	const originalFetch = window.fetch;
	window.fetch = function(...args) {
		const startTime = performance.now();
		return originalFetch.apply(this, args).then(response => {
			const endTime = performance.now();
			const duration = endTime - startTime;
			
			if (duration > 1000) {
				console.warn(`API请求耗时较长: ${args[0]}, 耗时: ${duration.toFixed(2)}ms`);
			}
			
			return response;
		});
	};
}


// ==================== 修改：加载记账记录函数 ====================
// ==================== 修改：加载记账记录函数 ====================
function loadAccountRecords(page = currentAccountPage) {
	showAccountLoading();
	
	const perPage = accountsPerPage;
	
	console.log('加载记录 - 当前页面:', page, '搜索参数:', currentSearchParams);
	
	try {
		// 如果有搜索条件，使用搜索，否则正常加载
		if (currentSearchParams && Object.keys(currentSearchParams).length > 0) {
			// 使用搜索参数加载，但要确保参数格式正确
			const searchData = {
				...currentSearchParams,
				page: page,
				per_page: perPage
			};
			
			// 清理参数：移除可能的空值或无效值
			Object.keys(searchData).forEach(key => {
				if (searchData[key] === '' || searchData[key] === '全部' || searchData[key] === null) {
					// 对于空字符串或"全部"，删除这个参数，让后端使用默认值
					delete searchData[key];
				}
			});
			
			console.log('发送搜索请求，参数:', searchData);
			
			fetch('/api/account/records/search', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(searchData)
			})
			.then(response => {
				console.log('搜索响应状态:', response.status);
				if (!response.ok) {
					// 尝试获取更详细的错误信息
					return response.text().then(text => {
						console.error('搜索响应文本:', text);
						throw new Error(`搜索失败: ${response.status} ${response.statusText}`);
					});
				}
				return response.json();
			})
			.then(data => {
				console.log('搜索返回数据:', data);
				processAccountData(data);
				hideAccountLoading();
			})
			.catch(error => {
				console.error('搜索记录失败:', error);
				
				// 如果搜索失败，尝试重新加载所有数据
				console.log('搜索失败，尝试加载所有数据...');
				currentSearchParams = null;
				loadAllAccountRecords(page);
			});
		} else {
			// 正常加载数据（无搜索条件）
			loadAllAccountRecords(page);
		}
	} catch (error) {
		console.error('加载记账记录发生异常:', error);
		showAlert('加载记账记录失败: ' + error.message, 'error');
		hideAccountLoading();
	}
}

// 新增：加载所有记录（无搜索条件）
function loadAllAccountRecords(page = 1) {
	console.log('加载所有记录，页码:', page);
	
	fetch(`/api/account/records?page=${page}&per_page=${accountsPerPage}`)
		.then(response => {
			if (!response.ok) {
				return response.text().then(text => {
					console.error('API响应错误:', text);
					throw new Error(`网络响应不正常: ${response.status}`);
				});
			}
			return response.json();
		})
		.then(data => {
			processAccountData(data);
			hideAccountLoading();
		})
		.catch(error => {
			console.error('加载所有记录失败:', error);
			showAlert('加载记录失败: ' + error.message, 'error');
			hideAccountLoading();
		});
}

function processAccountData(data) {
// 确保数据存在
if (!data) {
	console.error('数据为空:', data);
	showAlert('获取数据失败', 'error');
	return;
}

// 处理不同的数据结构
if (data.records) {
	accountRecords = data.records;
} else {
	accountRecords = data;
}

// 设置默认值
totalAccountRecords = data.pagination?.total || 0;
totalAccountPages = data.pagination?.total_pages || 1;
currentAccountPage = data.pagination?.page || 1;

// 更新统计信息（兼容不同数据结构）
if (data.stats) {
	updateAccountStatisticsFromData(data.stats);
} else if (data.basic) {
	// 如果数据结构不同，尝试从 basic 字段获取
	updateAccountStatisticsFromData(data.basic);
} else {
	// 如果没有统计信息，手动计算
	const stats = {
		total_count: totalAccountRecords,
		total_expense: 0,
		total_income: 0,
		net_amount: 0
	};
	
	// 如果 records 存在，计算统计
	if (accountRecords && accountRecords.length > 0) {
		accountRecords.forEach(record => {
			if (record.record_type === '支出') {
				stats.total_expense += parseFloat(record.amount) || 0;
			} else {
				stats.total_income += parseFloat(record.amount) || 0;
			}
		});
		stats.net_amount = stats.total_income - stats.total_expense;
	}
	
	updateAccountStatisticsFromData(stats);
}

document.getElementById('accountRecordsCount').textContent = `${totalAccountRecords} 条记录`;
renderAccountRecords();
updateAccountPagination();
}


// 加载记账类别
function loadAccountCategories() {
	fetch('/api/account/categories')
		.then(response => {
			if (!response.ok) {
				throw new Error('网络响应不正常');
			}
			return response.json();
		})
		.then(data => {
			// 验证类别数据
			if (!Array.isArray(data) || data.length === 0) {
				console.warn('API返回的类别数据为空或格式错误，使用默认类别');
				accountCategories = defaultCategories;
			} else {
				accountCategories = data;
			}
			updateCategoryFilters();
		})
		.catch(error => {
			console.error('加载记账类别失败:', error);
			showAlert('加载记账类别失败: ' + error.message, 'error');
			// 使用默认类别作为后备
			accountCategories = defaultCategories;
			updateCategoryFilters();
		});
}

// 更新类别筛选器
// 更新类别筛选器
function updateCategoryFilters() {
	console.log('更新类别筛选器');
	
	const searchCategory = document.getElementById('searchCategory');
	const searchSubcategory = document.getElementById('searchSubcategory');
	
	// 保存当前选中的值
	const currentCategory = searchCategory.value;
	const currentSubcategory = searchSubcategory.value;
	
	// 清空现有选项
	searchCategory.innerHTML = '<option value="全部">全部</option>';
	searchSubcategory.innerHTML = '<option value="全部">全部</option>';

	// 获取所有类别
	const categories = [...new Set(accountCategories.map(cat => cat.category_name))];
	categories.forEach(category => {
		const option = document.createElement('option');
		option.value = category;
		option.textContent = category;
		searchCategory.appendChild(option);
	});
	
	// 恢复之前选中的值
	if (currentCategory && currentCategory !== '全部') {
		searchCategory.value = currentCategory;
	}
	
	// 更新子类别选项
	updateSubcategoryOptions();
}

// 新增：更新子类别选项
function updateSubcategoryOptions() {
	const searchCategory = document.getElementById('searchCategory');
	const searchSubcategory = document.getElementById('searchSubcategory');
	
	// 保存当前选中的值
	const currentSubcategory = searchSubcategory.value;
	
	// 清空现有选项
	searchSubcategory.innerHTML = '<option value="全部">全部</option>';
	
	const selectedCategory = accountCategories.find(cat => cat.category_name === searchCategory.value);
	
	if (selectedCategory && selectedCategory.subcategories) {
		selectedCategory.subcategories.forEach(subcat => {
			const option = document.createElement('option');
			option.value = subcat;
			option.textContent = subcat;
			searchSubcategory.appendChild(option);
		});
	}
	
	// 恢复之前选中的值
	if (currentSubcategory && currentSubcategory !== '全部') {
		searchSubcategory.value = currentSubcategory;
	}
}



// ==================== 修改：搜索记账记录 ====================
// 修改搜索函数，确保搜索前下拉框已更新
// ==================== 修改：搜索记账记录 ====================
// ==================== 修改：搜索记账记录 ====================
function searchAccountRecords(page = 1) {
	console.log('开始搜索，页码:', page);
	
	// 收集搜索条件
	const searchData = {
		record_type: document.getElementById('searchAccountType').value,
		category: document.getElementById('searchCategory').value,
		subcategory: document.getElementById('searchSubcategory').value,
		start_date: document.getElementById('searchStartDate').value,
		end_date: document.getElementById('searchEndDate').value,
		owner: document.getElementById('searchAccountOwner').value,
		page: page,
		per_page: accountsPerPage
	};

	console.log('搜索参数:', searchData);
	
	// 清理参数：移除空值或"全部"值
	Object.keys(searchData).forEach(key => {
		if (searchData[key] === '' || searchData[key] === '全部' || searchData[key] === null || searchData[key] === undefined) {
			delete searchData[key];
		}
	});
	
	// 验证日期范围
	if (searchData.start_date && searchData.end_date && searchData.start_date > searchData.end_date) {
		showAlert('开始日期不能晚于结束日期', 'error');
		return;
	}
	
	// 保存搜索参数
	currentSearchParams = { ...searchData };
	
	// 显示加载状态
	showAccountLoading();
	
	fetch('/api/account/records/search', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(searchData)
	})
	.then(response => {
		console.log('API响应状态:', response.status, response.statusText);
		if (!response.ok) {
			return response.text().then(text => {
				console.error('API错误响应:', text);
				throw new Error(`搜索失败: ${response.status}`);
			});
		}
		return response.json();
	})
	.then(data => {
		console.log('搜索成功，返回数据:', data);
		
		if (data.error) {
			throw new Error(data.error);
		}
		
		processAccountData(data);
		hideAccountLoading();
	})
	.catch(error => {
		console.error('搜索记录失败:', error);
		showAlert('搜索记录失败: ' + error.message, 'error');
		hideAccountLoading();
	});
}


function initVirtualScroll() {
	const tableContainer = document.querySelector('.table-container');
	const tbody = document.getElementById('accountRecordsTableBody');
	
	let visibleStart = 0;
	let visibleEnd = 0;
	const rowHeight = 40; // 预估行高
	
	function updateVisibleRows() {
		const scrollTop = tableContainer.scrollTop;
		const visibleHeight = tableContainer.clientHeight;
		
		visibleStart = Math.floor(scrollTop / rowHeight);
		visibleEnd = Math.ceil((scrollTop + visibleHeight) / rowHeight);
		
		renderVirtualRows();
	}
	
	function renderVirtualRows() {
		// 清空现有行
		tbody.innerHTML = '';
		
		// 计算需要渲染的行范围
		const start = Math.max(0, visibleStart - 5); // 预渲染5行
		const end = Math.min(totalAccountRecords, visibleEnd + 5); // 预渲染5行
		
		// 创建占位行
		if (start > 0) {
			const placeholder = document.createElement('tr');
			placeholder.style.height = (start * rowHeight) + 'px';
			tbody.appendChild(placeholder);
		}
		
		// 渲染可见行
		for (let i = start; i < end; i++) {
			if (i < accountRecords.length) {
				const record = accountRecords[i];
				const tr = createTableRow(record, i);
				tbody.appendChild(tr);
			}
		}
		
		// 底部占位
		if (end < totalAccountRecords) {
			const placeholder = document.createElement('tr');
			placeholder.style.height = ((totalAccountRecords - end) * rowHeight) + 'px';
			tbody.appendChild(placeholder);
		}
	}
	
	tableContainer.addEventListener('scroll', updateVisibleRows);
	window.addEventListener('resize', updateVisibleRows);
	
	// 初始化
	updateVisibleRows();
}


// ==================== 修改：渲染记账记录表格 ====================
function renderAccountRecords() {
	const tbody = document.getElementById('accountRecordsTableBody');
	tbody.innerHTML = '';

	if (accountRecords.length === 0) {
		const tr = document.createElement('tr');
		tr.innerHTML = `<td colspan="10" class="text-center py-4 text-muted">暂无记账记录</td>`;
		tbody.appendChild(tr);
		updateAccountPaginationInfo();
		return;
	}

	accountRecords.forEach((record, index) => {
		const typeClass = record.record_type === '支出' ? 'type-expense' : 'type-income';
		const ownerClass = record.owner === '郭宁' ? 'owner-userA' : 'owner-userB';
		
		const tr = document.createElement('tr');
		tr.innerHTML = `
			<td><input type="checkbox" class="account-record-checkbox" value="${record.id}"></td>
			<td><span class="status-badge ${typeClass}">${record.record_type}</span></td>
			<td>${record.category}</td>
			<td>${record.subcategory || '-'}</td>
			<td>${parseFloat(record.amount).toFixed(2)}</td>
			<td>${record.account_date}</td>
			<td>${record.description || '-'}</td>
			<td>${record.payment_method || '现金'}</td>
			<td><span class="owner-badge ${ownerClass}">${record.owner || '郭宁'}</span></td>
			<td>
				<button class="btn btn-sm btn-outline-primary me-1 btn-sm-compact" onclick="editAccountRecord(${record.id})" title="编辑">
					<i class="bi bi-pencil"></i>
				</button>
				<button class="btn btn-sm btn-outline-danger btn-sm-compact" onclick="deleteAccountRecord(${record.id})" title="删除">
					<i class="bi bi-trash"></i>
				</button>
			</td>
		`;
		tbody.appendChild(tr);
	});

	updateAccountPaginationInfo();

	// 添加复选框事件监听
	document.querySelectorAll('.account-record-checkbox').forEach(checkbox => {
		checkbox.addEventListener('change', function() {
			if (this.checked) {
				selectedAccountRecords.add(parseInt(this.value));
			} else {
				selectedAccountRecords.delete(parseInt(this.value));
			}
			updateSelectAllAccountsState();
		});
	});
	
	updateSelectAllAccountsState();
}


// 从API数据更新统计信息
function updateAccountStatisticsFromData(stats) {
	console.log('更新统计信息:', stats);
	
	if (!stats) {
		console.warn('统计信息为空');
		return;
	}
	
	// 确保所有值都有默认值
	const safeStats = {
		total_count: stats.total_count || 0,
		total_expense: stats.total_expense || 0,
		total_income: stats.total_income || 0,
		net_amount: stats.net_amount || 0
	};
	
	// 更新显示
	document.getElementById('totalAccountCount').textContent = safeStats.total_count;
	document.getElementById('totalExpenseAmount').textContent = safeStats.total_expense.toFixed(2);
	document.getElementById('totalIncomeAmount').textContent = safeStats.total_income.toFixed(2);
	document.getElementById('netAmount').textContent = safeStats.net_amount.toFixed(2);
	
	// 设置净收入的颜色
	const netElement = document.getElementById('netAmount');
	netElement.className = safeStats.net_amount >= 0 ? 'stats-number positive' : 'stats-number negative';
}

// 子类别统计相关功能
function openSubcategoryStatisticsModal() {
	const modal = new bootstrap.Modal(document.getElementById('subcategoryStatisticsModal'));
	modal.show();
	
	// 设置默认日期
	const today = new Date().toISOString().split('T')[0];
	const oneMonthAgo = new Date();
	oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
	
	document.getElementById('subcategoryStartDate').value = oneMonthAgo.toISOString().split('T')[0];
	document.getElementById('subcategoryEndDate').value = today;
	
	// 加载子类别选项
	loadSubcategoryOptions();
	
	// 隐藏结果卡片
	document.getElementById('subcategoryResultCard').style.display = 'none';
	document.getElementById('exportSubcategoryBtn').style.display = 'none';
}

function loadSubcategoryOptions() {
	const subcategorySelect = document.getElementById('subcategoryName');
	subcategorySelect.innerHTML = '<option value="全部">全部子类型</option>';
	
	// 从现有记录中提取所有子类别
	const allSubcategories = new Set();
	
	accountRecords.forEach(record => {
		if (record.subcategory && record.subcategory.trim() !== '') {
			allSubcategories.add(record.subcategory);
		}
	});
	
	// 按字母顺序排序
	const sortedSubcategories = Array.from(allSubcategories).sort();
	
	sortedSubcategories.forEach(subcategory => {
		const option = document.createElement('option');
		option.value = subcategory;
		option.textContent = subcategory;
		subcategorySelect.appendChild(option);
	});
	
	// 如果没有子类别数据，显示提示
	if (sortedSubcategories.length === 0) {
		const option = document.createElement('option');
		option.value = "";
		option.textContent = "暂无子类别数据";
		option.disabled = true;
		subcategorySelect.appendChild(option);
	}
}

function calculateSubcategoryStatistics() {
	const subcategory = document.getElementById('subcategoryName').value;
	const owner = document.getElementById('subcategoryOwner').value;
	const startDate = document.getElementById('subcategoryStartDate').value;
	const endDate = document.getElementById('subcategoryEndDate').value;
	
	// 验证日期
	if (!startDate || !endDate) {
		showAlert('请选择开始日期和结束日期', 'error');
		return;
	}
	
	if (startDate > endDate) {
		showAlert('开始日期不能晚于结束日期', 'error');
		return;
	}
	
	const calculateBtn = document.getElementById('calculateSubcategoryBtn');
	const originalText = calculateBtn.innerHTML;
	calculateBtn.innerHTML = '<i class="bi bi-hourglass-split me-1"></i>计算中...';
	calculateBtn.disabled = true;
	
	// 构建查询参数
	const params = new URLSearchParams({
		subcategory: subcategory,
		owner: owner,
		start_date: startDate,
		end_date: endDate
	});
	
	fetch(`/api/account/statistics/subcategory?${params}`)
		.then(response => {
			if (!response.ok) {
				throw new Error('统计计算失败');
			}
			return response.json();
		})
		.then(data => {
			if (data.success) {
				displaySubcategoryResults(data);
				document.getElementById('exportSubcategoryBtn').style.display = 'inline-block';
			} else {
				throw new Error(data.message || '统计计算失败');
			}
		})
		.catch(error => {
			console.error('计算子类别统计失败:', error);
			showAlert('计算子类别统计失败: ' + error.message, 'error');
		})
		.finally(() => {
			calculateBtn.innerHTML = originalText;
			calculateBtn.disabled = false;
		});
}

function displaySubcategoryResults(data) {
	const resultCard = document.getElementById('subcategoryResultCard');
	const totalAmount = document.getElementById('subcategoryTotalAmount');
	const expenseAmount = document.getElementById('subcategoryExpenseAmount');
	const incomeAmount = document.getElementById('subcategoryIncomeAmount'); 
	const resultText = document.getElementById('subcategoryResultText');
	
	// 确保从数据中获取正确的字段
	const total = parseFloat(data.total_amount || 0);
	const expense = parseFloat(data.expense_amount || 0);
	const income = parseFloat(data.income_amount || 0);
	
	// 更新金额显示
	totalAmount.textContent = total.toFixed(2);
	expenseAmount.textContent = expense.toFixed(2);
	incomeAmount.textContent = income.toFixed(2);
	
	// 构建结果说明文本
	const subcategory = document.getElementById('subcategoryName').value;
	const owner = document.getElementById('subcategoryOwner').value;
	const startDate = document.getElementById('subcategoryStartDate').value;
	const endDate = document.getElementById('subcategoryEndDate').value;
	
	let conditionText = `统计条件：`;
	conditionText += `时间段 ${startDate} 至 ${endDate}`;
	
	if (subcategory !== '全部') {
		conditionText += `，子类型 "${subcategory}"`;
	}
	
	if (owner !== '全部') {
		conditionText += `，所属人 "${owner}"`;
	}
	
	let resultDesc = `${conditionText}。`;
	resultDesc += `共找到 ${data.record_count || 0} 条记录，`;
	resultDesc += `总金额 ¥${total.toFixed(2)}，`;
	resultDesc += `其中支出 ¥${expense.toFixed(2)}，`;
	resultDesc += `收入 ¥${income.toFixed(2)}。`;
	
	if (data.net_amount !== undefined) {
		const netAmount = parseFloat(data.net_amount);
		const netType = netAmount >= 0 ? '净收入' : '净支出';
		resultDesc += ` ${netType} ¥${Math.abs(netAmount).toFixed(2)}。`;
	}
	
	resultText.textContent = resultDesc;
	
	// 显示结果卡片
	resultCard.style.display = 'block';
	
	// 保存当前查询条件用于导出
	window.currentSubcategoryQuery = {
		subcategory: subcategory,
		owner: owner,
		start_date: startDate,
		end_date: endDate
	};
}

function exportSubcategoryResults() {
	if (!window.currentSubcategoryQuery) {
		showAlert('没有可导出的统计结果', 'error');
		return;
	}
	
	const params = new URLSearchParams(window.currentSubcategoryQuery);
	window.open(`/api/account/statistics/subcategory/export?${params}`, '_blank');
	showAlert('导出任务已开始，请稍候...', 'success');
}

// 分页相关函数
function updateAccountPaginationInfo() {
	const startItem = (currentAccountPage - 1) * accountsPerPage + 1;
	const endItem = Math.min(currentAccountPage * accountsPerPage, totalAccountRecords);
	document.getElementById('accountPaginationInfo').textContent = 
		`显示 ${startItem}-${endItem} 条，共 ${totalAccountRecords} 条记录`;
		
	document.getElementById('accountPageJumpInput').max = totalAccountPages;
	document.getElementById('accountPageJumpInput').value = currentAccountPage;
}

// 修改：使用onclick属性绑定分页按钮
function updateAccountPagination() {
	const pagination = document.getElementById('accountPagination');
	pagination.innerHTML = '';

	if (totalAccountPages <= 1) return;

	// 首页按钮
	const firstLi = document.createElement('li');
	firstLi.className = `page-item ${currentAccountPage === 1 ? 'disabled' : ''}`;
	firstLi.innerHTML = `
		<a class="page-link" href="#" aria-label="首页" onclick="changeAccountPage(1)">
			<i class="bi bi-chevron-double-left"></i>
		</a>
	`;
	pagination.appendChild(firstLi);

	// 上一页按钮
	const prevLi = document.createElement('li');
	prevLi.className = `page-item ${currentAccountPage === 1 ? 'disabled' : ''}`;
	prevLi.innerHTML = `
		<a class="page-link" href="#" aria-label="上一页" onclick="changeAccountPage(${currentAccountPage - 1})">
			<i class="bi bi-chevron-left"></i>
		</a>
	`;
	pagination.appendChild(prevLi);

	// 页码按钮
	const maxVisiblePages = 5;
	let startPage = Math.max(1, currentAccountPage - Math.floor(maxVisiblePages / 2));
	let endPage = Math.min(totalAccountPages, startPage + maxVisiblePages - 1);
	
	if (endPage - startPage + 1 < maxVisiblePages) {
		startPage = Math.max(1, endPage - maxVisiblePages + 1);
	}

	if (startPage > 1) {
		const pageLi = document.createElement('li');
		pageLi.className = 'page-item';
		pageLi.innerHTML = `<a class="page-link" href="#" onclick="changeAccountPage(1)">1</a>`;
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
		pageLi.className = `page-item ${i === currentAccountPage ? 'active' : ''}`;
		pageLi.innerHTML = `<a class="page-link" href="#" onclick="changeAccountPage(${i})">${i}</a>`;
		pagination.appendChild(pageLi);
	}

	if (endPage < totalAccountPages) {
		if (endPage < totalAccountPages - 1) {
			const ellipsisLi = document.createElement('li');
			ellipsisLi.className = 'page-item disabled';
			ellipsisLi.innerHTML = `<span class="page-link">...</span>`;
			pagination.appendChild(ellipsisLi);
		}
		
		const pageLi = document.createElement('li');
		pageLi.className = 'page-item';
		pageLi.innerHTML = `<a class="page-link" href="#" onclick="changeAccountPage(${totalAccountPages})">${totalAccountPages}</a>`;
		pagination.appendChild(pageLi);
	}

	// 下一页按钮
	const nextLi = document.createElement('li');
	nextLi.className = `page-item ${currentAccountPage === totalAccountPages ? 'disabled' : ''}`;
	nextLi.innerHTML = `
		<a class="page-link" href="#" aria-label="下一页" onclick="changeAccountPage(${currentAccountPage + 1})">
			<i class="bi bi-chevron-right"></i>
		</a>
	`;
	pagination.appendChild(nextLi);

	// 尾页按钮
	const lastLi = document.createElement('li');
	lastLi.className = `page-item ${currentAccountPage === totalAccountPages ? 'disabled' : ''}`;
	lastLi.innerHTML = `
		<a class="page-link" href="#" aria-label="尾页" onclick="changeAccountPage(${totalAccountPages})">
			<i class="bi bi-chevron-double-right"></i>
		</a>
	`;
	pagination.appendChild(lastLi);

	// 更新跳转输入框
	updateAccountPageJumpInput();
}

// 修改：添加跳转输入框更新函数
function updateAccountPageJumpInput() {
	const accountPageJumpInput = document.getElementById('accountPageJumpInput');
	if (!accountPageJumpInput) return;
	
	accountPageJumpInput.value = currentAccountPage;
	accountPageJumpInput.max = totalAccountPages;
	accountPageJumpInput.min = 1;
}

// ==================== 修改：跳转到指定页面函数 ====================
function jumpToAccountPage() {
	const accountPageJumpInput = document.getElementById('accountPageJumpInput');
	if (!accountPageJumpInput) return;
	
	const targetPage = parseInt(accountPageJumpInput.value);
	
	if (isNaN(targetPage) || targetPage < 1 || targetPage > totalAccountPages) {
		showAlert(`请输入有效的页码 (1-${totalAccountPages})`, 'error');
		accountPageJumpInput.value = currentAccountPage;
		return;
	}
	
	changeAccountPage(targetPage);
}

// 修改：添加改变页面函数 - 修复分页问题
// ==================== 修改：改变页面函数 ====================
function changeAccountPage(page) {
	if (page < 1 || page > totalAccountPages) return;
	currentAccountPage = page;
	loadAccountRecords(page);
}

// 显示/隐藏加载状态
function showAccountLoading() {
	document.getElementById('accountLoadingSpinner').style.display = 'block';
}

function hideAccountLoading() {
	document.getElementById('accountLoadingSpinner').style.display = 'none';
}

// 打开添加记账记录模态框
// 打开添加记账记录模态框
function openAddAccountModal() {
	document.getElementById('accountModalTitle').textContent = '添加记账记录';
	document.getElementById('accountRecordForm').reset();
	document.getElementById('accountRecordId').value = '';
	
	// 设置默认日期为今天
	const today = new Date().toISOString().split('T')[0];
	document.getElementById('accountDate').value = today;
	
	// 加载类别选项
	loadCategoryOptions();
	
	// 确保所属人下拉框是最新的
	updateOwnerSelect('accountOwner', allOwners, null, allOwners[0] || '郭宁');
	
	const modal = new bootstrap.Modal(document.getElementById('accountRecordModal'));
	modal.show();
}


// 修改：加载类别选项函数 - 修复类别加载问题
function loadCategoryOptions() {
	const recordType = document.getElementById('accountRecordType').value;
	const categorySelect = document.getElementById('accountCategory');
	const subcategorySelect = document.getElementById('accountSubcategory');
	
	// 清空选项
	categorySelect.innerHTML = '<option value="">请选择类别</option>';
	subcategorySelect.innerHTML = '<option value="">请选择子类别</option>';
	
	// 根据记录类型过滤类别
	const filteredCategories = accountCategories.filter(cat => cat.category_type === recordType);
	
	if (filteredCategories.length === 0) {
		console.warn(`未找到 ${recordType} 类型的类别`);
		// 如果没有找到类别，使用默认类别作为后备
		const fallbackCategories = defaultCategories.filter(cat => cat.category_type === recordType);
		if (fallbackCategories.length > 0) {
			filteredCategories.push(...fallbackCategories);
		}
	}
	
	filteredCategories.forEach(category => {
		const option = document.createElement('option');
		option.value = category.category_name;
		option.textContent = category.category_name;
		categorySelect.appendChild(option);
	});
	
	// 重新绑定类别变化事件
	categorySelect.onchange = function() {
		const selectedCategoryName = this.value;
		const selectedCategory = filteredCategories.find(cat => cat.category_name === selectedCategoryName);
		subcategorySelect.innerHTML = '<option value="">请选择子类别</option>';
		
		if (selectedCategory && selectedCategory.subcategories && selectedCategory.subcategories.length > 0) {
			selectedCategory.subcategories.forEach(subcat => {
				const option = document.createElement('option');
				option.value = subcat;
				option.textContent = subcat;
				subcategorySelect.appendChild(option);
			});
		}
	};
}

// 修改：编辑记账记录函数 - 修复子类别问题
// 修改编辑记账记录函数
function editAccountRecord(id) {
	const record = accountRecords.find(r => r.id === id);
	if (!record) return;

	document.getElementById('accountModalTitle').textContent = '编辑记账记录';
	document.getElementById('accountRecordId').value = record.id;
	document.getElementById('accountRecordType').value = record.record_type;
	
	// 这里需要确保所属人下拉框已更新
	setTimeout(() => {
		document.getElementById('accountOwner').value = record.owner || '郭宁';
	}, 100);
	
	document.getElementById('accountAmount').value = record.amount;
	document.getElementById('accountDate').value = record.account_date;
	document.getElementById('accountDescription').value = record.description || '';
	document.getElementById('accountPaymentMethod').value = record.payment_method || '现金';

	// 加载类别选项
	loadCategoryOptions();
	
	// 确保所属人下拉框已更新
	updateOwnerSelect('accountOwner', allOwners, null, record.owner || '郭宁');
	
	setTimeout(() => {
		const categorySelect = document.getElementById('accountCategory');
		const subcategorySelect = document.getElementById('accountSubcategory');
		
		// 设置类别值
		if (categorySelect) {
			categorySelect.value = record.category;
			
			// 触发类别变化事件来加载子类别
			const event = new Event('change');
			categorySelect.dispatchEvent(event);
			
			// 等待子类别加载完成后设置子类别值
			setTimeout(() => {
				if (record.subcategory && subcategorySelect) {
					subcategorySelect.value = record.subcategory;
				}
			}, 100);
		}
	}, 200);

	const modal = new bootstrap.Modal(document.getElementById('accountRecordModal'));
	modal.show();
}


// ==================== 修改：保存记账记录 ====================
function saveAccountRecord() {
	const formData = {
		record_type: document.getElementById('accountRecordType').value,
		owner: document.getElementById('accountOwner').value,
		category: document.getElementById('accountCategory').value,
		subcategory: document.getElementById('accountSubcategory').value,
		amount: parseFloat(document.getElementById('accountAmount').value),
		account_date: document.getElementById('accountDate').value,
		description: document.getElementById('accountDescription').value,
		payment_method: document.getElementById('accountPaymentMethod').value
	};

	// 验证数据
	if (!formData.category) {
		showAlert('请选择类别', 'error');
		return;
	}
	if (!formData.amount || formData.amount <= 0) {
		showAlert('金额必须大于0', 'error');
		return;
	}
	if (!formData.account_date) {
		showAlert('请选择日期', 'error');
		return;
	}

	const recordId = document.getElementById('accountRecordId').value;
	const saveBtn = document.getElementById('saveAccountRecordBtn');
	const originalText = saveBtn.innerHTML;
	saveBtn.innerHTML = '<i class="bi bi-hourglass-split me-1"></i>保存中...';
	saveBtn.disabled = true;

	const url = recordId ? `/api/account/records/${recordId}` : '/api/account/records';
	const method = recordId ? 'PUT' : 'POST';

	fetch(url, {
		method: method,
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(formData)
	})
	.then(response => {
		if (!response.ok) {
			throw new Error('保存失败');
		}
		return response.json();
	})
	.then(data => {
		if (data.success) {
			showAlert(recordId ? '记录更新成功！' : '记录添加成功！', 'success');
			const modal = bootstrap.Modal.getInstance(document.getElementById('accountRecordModal'));
			modal.hide();
			
			// 保存后重新加载数据
			if (recordId) {
				// 编辑后保持在当前页
				loadAccountRecords(currentAccountPage);
			} else {
				// 添加后回到第一页
				currentAccountPage = 1;
				loadAccountRecords(1);
			}
		} else if (data.duplicate) {
			// 处理重复记录
			showAlert(data.message, 'error');
		} else {
			throw new Error(data.message || '保存失败');
		}
	})
	.catch(error => {
		console.error('保存记录失败:', error);
		showAlert('保存记录失败: ' + error.message, 'error');
	})
	.finally(() => {
		saveBtn.innerHTML = originalText;
		saveBtn.disabled = false;
	});
}

// ==================== 修改：删除记账记录 ====================
function deleteAccountRecord(id) {
	showConfirm('确定要删除这条记账记录吗？此操作不可恢复！', function() {
		deleteAccountRecordConfirmed(id);
	});
}

function deleteAccountRecordConfirmed(id) {
	fetch(`/api/account/records/${id}`, {
		method: 'DELETE'
	})
	.then(response => {
		if (!response.ok) {
			throw new Error('删除失败');
		}
		return response.json();
	})
	.then(data => {
		if (data.success) {
			showAlert('记账记录删除成功！', 'success');
			
			// 删除后重新加载当前页数据
			// 如果当前页没有数据了，自动跳转到上一页
			if (accountRecords.length === 1 && currentAccountPage > 1) {
				// 当前页只剩一条记录，删除后跳转到上一页
				currentAccountPage--;
			}
			loadAccountRecords(currentAccountPage);
		} else {
			throw new Error(data.message || '删除失败');
		}
	})
	.catch(error => {
		console.error('删除记录失败:', error);
		showAlert('删除记录失败: ' + error.message, 'error');
	});
}

// 删除选中的记账记录
function deleteSelectedAccountRecords() {
	if (selectedAccountRecords.size === 0) {
		showAlert('请先选择要删除的记录', 'error');
		return;
	}

	showConfirm(`确定要删除选中的 ${selectedAccountRecords.size} 条记账记录吗？此操作不可恢复！`, function() {
		deleteSelectedAccountRecordsConfirmed();
	});
}

// ==================== 修改：删除选中的记账记录 ====================
function deleteSelectedAccountRecordsConfirmed() {
	const deletePromises = Array.from(selectedAccountRecords).map(id => 
		fetch(`/api/account/records/${id}`, {
			method: 'DELETE'
		}).then(response => response.json())
	);

	Promise.all(deletePromises)
		.then(results => {
			const successCount = results.filter(result => result.success).length;
			if (successCount > 0) {
				showAlert(`成功删除 ${successCount} 条记账记录！`, 'success');
			} else {
				showAlert('删除记录失败', 'error');
			}
			selectedAccountRecords.clear();
			
			// 删除后重新加载数据
			// 如果当前页没有数据了，自动跳转到上一页
			if (accountRecords.length === selectedAccountRecords.size && currentAccountPage > 1) {
				// 当前页所有记录都被删除，跳转到上一页
				currentAccountPage--;
			}
			loadAccountRecords(currentAccountPage);
		})
		.catch(error => {
			console.error('批量删除记录失败:', error);
			showAlert('批量删除记录失败: ' + error.message, 'error');
		});
}

// 全选/取消全选
function toggleSelectAllAccounts() {
	const checkAll = document.getElementById('selectAllAccounts').checked;
	document.querySelectorAll('.account-record-checkbox').forEach(checkbox => {
		checkbox.checked = checkAll;
		if (checkAll) {
			selectedAccountRecords.add(parseInt(checkbox.value));
		} else {
			selectedAccountRecords.delete(parseInt(checkbox.value));
		}
	});
}

// 更新全选复选框状态
function updateSelectAllAccountsState() {
	const checkboxes = document.querySelectorAll('.account-record-checkbox');
	const allChecked = checkboxes.length > 0 && Array.from(checkboxes).every(cb => cb.checked);
	document.getElementById('selectAllAccounts').checked = allChecked;
	document.getElementById('selectAllAccounts').indeterminate = !allChecked && selectedAccountRecords.size > 0;
}

// 显示记账统计
function showAccountStatistics() {
	const modal = new bootstrap.Modal(document.getElementById('accountStatisticsModal'));
	modal.show();
	
	// 加载默认统计
	loadDetailedStatistics();
	
	// 加载图表数据
	setTimeout(() => {
		loadChartData();
	}, 500);
}

// 加载详细统计
function loadDetailedStatistics() {
	const statType = document.getElementById('statisticsType').value;
	const startDate = document.getElementById('statisticsStartDate').value;
	const endDate = document.getElementById('statisticsEndDate').value;
	const owner = document.getElementById('statisticsOwner').value;
	
	// 构建查询参数
	const params = new URLSearchParams({
		type: statType,
		start_date: startDate,
		end_date: endDate,
		owner: owner
	});

	fetch(`/api/account/statistics/detailed?${params}`)
		.then(response => {
			if (!response.ok) {
				throw new Error('获取统计失败');
			}
			return response.json();
		})
		.then(data => {
			renderStatistics(data);
		})
		.catch(error => {
			console.error('获取统计失败:', error);
			showAlert('获取统计失败: ' + error.message, 'error');
		});
}

// 渲染统计信息
function renderStatistics(data) {
	if (!data) {
		showAlert('统计数据为空', 'error');
		return;
	}
	
	// 更新统计标题
	const statTypeNames = {
		'monthly': '月度统计',
		'quarterly': '季度统计', 
		'yearly': '年度统计',
		'category': '类别统计',
		'subcategory': '子类别统计',
		'owner_detail': '所属人详细统计'
	};
	document.getElementById('detailedStatsTitle').textContent = 
		`${statTypeNames[data.filters.type]} - ${data.filters.start_date} 至 ${data.filters.end_date}`;
	
	// 渲染汇总统计
	renderSummaryStatistics(data.summary);
	
	// 渲染详细统计表格
	renderDetailedStatisticsTable(data.statistics, data.filters.type);
	
	// 显示汇总卡片
	document.getElementById('summaryStatsCard').style.display = 'block';
}

// 渲染汇总统计
function renderSummaryStatistics(summary) {
	const container = document.getElementById('summaryStatsContent');
	const total = summary.total || {};
	
	// 确保所有值都是数字
	const totalCount = parseInt(total.total_count) || 0;
	const totalExpense = parseFloat(total.total_expense) || 0;
	const totalIncome = parseFloat(total.total_income) || 0;
	const netAmount = totalIncome - totalExpense;
	const netClass = netAmount >= 0 ? 'positive' : 'negative';
	
	container.innerHTML = `
		<div class="col-md-3">
			<div class="stats-card">
				<div class="stats-label">总记录数</div>
				<div class="stats-number text-primary">${totalCount}</div>
				<div class="stats-label">所有记账记录</div>
			</div>
		</div>
		<div class="col-md-3">
			<div class="stats-card">
				<div class="stats-label">总支出</div>
				<div class="stats-number text-danger">${totalExpense.toFixed(2)}</div>
				<div class="stats-label">所有支出金额</div>
			</div>
		</div>
		<div class="col-md-3">
			<div class="stats-card">
				<div class="stats-label">总收入</div>
				<div class="stats-number text-success">${totalIncome.toFixed(2)}</div>
				<div class="stats-label">所有收入金额</div>
			</div>
		</div>
		<div class="col-md-3">
			<div class="stats-card">
				<div class="stats-label">净收入</div>
				<div class="stats-number ${netClass}">${netAmount.toFixed(2)}</div>
				<div class="stats-label">收入 - 支出</div>
			</div>
		</div>
	`;
}

// 渲染详细统计表格
// 渲染详细统计表格
function renderDetailedStatisticsTable(statistics, statType) {
	const header = document.getElementById('statisticsTableHeader');
	const body = document.getElementById('detailedStatisticsTableBody');
	
	// 清空现有内容
	header.innerHTML = '';
	body.innerHTML = '';
	
	if (!statistics || statistics.length === 0) {
		const tr = document.createElement('tr');
		tr.innerHTML = `<td colspan="6" class="text-center py-4 text-muted">暂无统计数据</td>`;
		body.appendChild(tr);
		return;
	}
	
	// 根据统计类型设置表头
	let headers = [];
	if (statType === 'monthly') {
		headers = ['年月', '记录类型', '所属人', '记录数', '总金额'];
	} else if (statType === 'quarterly') {
		headers = ['季度', '记录类型', '所属人', '记录数', '总金额'];
	} else if (statType === 'yearly') {
		headers = ['年份', '记录类型', '所属人', '记录数', '总金额'];
	} else if (statType === 'category') {
		headers = ['类别', '记录类型', '所属人', '记录数', '总金额'];
	} else if (statType === 'subcategory') {
		headers = ['子类别', '记录类型', '所属人', '记录数', '总金额'];
	} else if (statType === 'owner_detail') {
		headers = ['所属人', '记录类型', '类别', '记录数', '总金额'];
	}
	
	// 渲染表头
	headers.forEach(headerText => {
		const th = document.createElement('th');
		th.textContent = headerText;
		header.appendChild(th);
	});
	
	// 渲染表格内容
	statistics.forEach(stat => {
		const tr = document.createElement('tr');
		
		// 确保金额是数字
		const totalAmount = parseFloat(stat.total_amount) || 0;
		
		// 获取期间名称
		let periodName = stat.period_name || '';
		
		// 如果没有period_name，根据其他字段构建
		if (!periodName) {
			if (statType === 'monthly' && stat.year && stat.month) {
				periodName = `${stat.year}年${String(stat.month).padStart(2, '0')}月`;
			} else if (statType === 'quarterly' && stat.year && stat.quarter) {
				periodName = `${stat.year}年第${stat.quarter}季度`;
			} else if (statType === 'yearly' && stat.year) {
				periodName = `${stat.year}年`;
			} else if (statType === 'category' && stat.category) {
				periodName = stat.category;
			} else if (statType === 'subcategory' && stat.category && stat.subcategory) {
				periodName = `${stat.category} - ${stat.subcategory}`;
			} else if (statType === 'owner_detail' && stat.owner) {
				periodName = stat.owner;
			}
		}
		
		if (statType === 'monthly' || statType === 'quarterly' || statType === 'yearly') {
			tr.innerHTML = `
				<td>${periodName}</td>
				<td><span class="status-badge ${stat.record_type === '支出' ? 'type-expense' : 'type-income'}">${stat.record_type}</span></td>
				<td><span class="owner-badge ${stat.owner === '郭宁' ? 'owner-userA' : 'owner-userB'}">${stat.owner}</span></td>
				<td>${stat.count}</td>
				<td class="${stat.record_type === '收入' ? 'positive' : 'negative'}">${totalAmount.toFixed(2)}</td>
			`;
		} else if (statType === 'category') {
			tr.innerHTML = `
				<td>${periodName}</td>
				<td><span class="status-badge ${stat.record_type === '支出' ? 'type-expense' : 'type-income'}">${stat.record_type}</span></td>
				<td><span class="owner-badge ${stat.owner === '郭宁' ? 'owner-userA' : 'owner-userB'}">${stat.owner}</span></td>
				<td>${stat.count}</td>
				<td class="${stat.record_type === '收入' ? 'positive' : 'negative'}">${totalAmount.toFixed(2)}</td>
			`;
		} else if (statType === 'subcategory') {
			tr.innerHTML = `
				<td>${periodName}</td>
				<td><span class="status-badge ${stat.record_type === '支出' ? 'type-expense' : 'type-income'}">${stat.record_type}</span></td>
				<td><span class="owner-badge ${stat.owner === '郭宁' ? 'owner-userA' : 'owner-userB'}">${stat.owner}</span></td>
				<td>${stat.count}</td>
				<td class="${stat.record_type === '收入' ? 'positive' : 'negative'}">${totalAmount.toFixed(2)}</td>
			`;
		} else if (statType === 'owner_detail') {
			tr.innerHTML = `
				<td>${periodName}</td>
				<td><span class="status-badge ${stat.record_type === '支出' ? 'type-expense' : 'type-income'}">${stat.record_type}</span></td>
				<td>${stat.category || ''}</td>
				<td>${stat.count}</td>
				<td class="${stat.record_type === '收入' ? 'positive' : 'negative'}">${totalAmount.toFixed(2)}</td>
			`;
		}
		
		body.appendChild(tr);
	});
}

// 导出统计信息
function exportStatistics() {
	const statType = document.getElementById('statisticsType').value;
	const startDate = document.getElementById('statisticsStartDate').value;
	const endDate = document.getElementById('statisticsEndDate').value;
	const owner = document.getElementById('statisticsOwner').value;
	
	// 构建查询参数
	const params = new URLSearchParams({
		type: statType,
		start_date: startDate,
		end_date: endDate,
		owner: owner
	});
	
	// 在新窗口打开导出链接
	window.open(`/api/account/statistics/export?${params}`, '_blank');
	showAlert('统计导出任务已开始，请稍候...', 'success');
}

// 导出所属人深度统计
function exportOwnerDeepStatistics() {
	if (!window.currentOwnerStatsQuery) {
		showAlert('没有可导出的统计结果', 'error');
		return;
	}
	
	const params = new URLSearchParams(window.currentOwnerStatsQuery);
	window.open(`/api/account/statistics/by_owner/export?${params}`, '_blank');
	showAlert('导出任务已开始，请稍候...', 'success');
}

// 导出所属人对比统计
function exportOwnerComparisonStatistics() {
	if (!window.currentOwnerCompareQuery) {
		showAlert('没有可导出的对比结果', 'error');
		return;
	}
	
	const params = new URLSearchParams(window.currentOwnerCompareQuery);
	window.open(`/api/account/statistics/owner_comparison/export?${params}`, '_blank');
	showAlert('导出任务已开始，请稍候...', 'success');
}

// 导出记账数据
// ==================== 修复：导出记账数据函数 ====================
// ==================== 修复：导出记账数据函数（增强版） ====================
function exportAccountData() {
	console.log('导出记账数据按钮被点击');
	
	try {
		// 收集当前的搜索条件
		const searchParams = {};
		
		// 获取记录类型
		const recordTypeElement = document.getElementById('searchAccountType');
		if (recordTypeElement && recordTypeElement.value && recordTypeElement.value !== '全部') {
			searchParams.record_type = recordTypeElement.value;
		}
		
		// 获取类别
		const categoryElement = document.getElementById('searchCategory');
		if (categoryElement && categoryElement.value && categoryElement.value !== '全部') {
			searchParams.category = categoryElement.value;
		}
		
		// 获取子类别
		const subcategoryElement = document.getElementById('searchSubcategory');
		if (subcategoryElement && subcategoryElement.value && subcategoryElement.value !== '全部') {
			searchParams.subcategory = subcategoryElement.value;
		}
		
		// 获取开始日期
		const startDateElement = document.getElementById('searchStartDate');
		if (startDateElement && startDateElement.value) {
			searchParams.start_date = startDateElement.value;
		}
		
		// 获取结束日期
		const endDateElement = document.getElementById('searchEndDate');
		if (endDateElement && endDateElement.value) {
			searchParams.end_date = endDateElement.value;
		}
		
		// 获取所属人
		const ownerElement = document.getElementById('searchAccountOwner');
		if (ownerElement && ownerElement.value && ownerElement.value !== '全部') {
			searchParams.owner = ownerElement.value;
		}
		
		console.log('导出参数:', searchParams);
		
		// 构建查询参数
		const params = new URLSearchParams(searchParams);
		
		// 生成导出URL
		const exportUrl = `/api/account/export?${params.toString()}`;
		console.log('导出URL:', exportUrl);
		
		// 使用fetch先检查API是否正常工作
		showAlert('正在准备导出，请稍候...', 'info');
		
		// 测试连接
		fetch(exportUrl, { method: 'HEAD' })
			.then(response => {
				if (response.ok) {
					// API正常，打开下载
					window.open(exportUrl, '_blank');
					showAlert('导出任务已开始，请在新窗口中查看下载文件...', 'success');
				} else {
					throw new Error(`API返回状态: ${response.status}`);
				}
			})
			.catch(error => {
				console.error('导出API错误:', error);
				showAlert(`导出失败: ${error.message}。请检查后端API是否正常运行。`, 'error');
			});
		
	} catch (error) {
		console.error('导出数据时发生错误:', error);
		showAlert('导出失败: ' + error.message, 'error');
	}
}

// 导入记账数据
function importAccountData() {
	const modal = new bootstrap.Modal(document.getElementById('importAccountDataModal'));
	modal.show();
}

// 确认导入数据
function confirmImportAccountData() {
	const fileInput = document.getElementById('importAccountFile');
	const file = fileInput.files[0];
	
	if (!file) {
		showAlert('请选择要导入的文件', 'error');
		return;
	}
	
	const formData = new FormData();
	formData.append('file', file);
	
	const importBtn = document.getElementById('confirmImportBtn');
	const originalText = importBtn.innerHTML;
	importBtn.innerHTML = '<i class="bi bi-hourglass-split me-1"></i>导入中...';
	importBtn.disabled = true;
	
	fetch('/api/account/import', {
		method: 'POST',
		body: formData
	})
	.then(response => {
		if (!response.ok) {
			throw new Error('导入失败');
		}
		return response.json();
	})
	.then(data => {
		if (data.success) {
			let message = `导入完成！成功导入 ${data.imported_count} 条记录`;
			if (data.duplicate_count > 0) {
				message += `，跳过 ${data.duplicate_count} 条重复记录`;
			}
			if (data.error_count > 0) {
				message += `，失败 ${data.error_count} 条记录`;
			}
			message += '。';
			
			showAlert(message, 'success');
			
			// 如果有重复记录，显示详细信息
			if (data.duplicate_messages && data.duplicate_messages.length > 0) {
				console.log('重复记录详情:', data.duplicate_messages);
			}
			
			const modal = bootstrap.Modal.getInstance(document.getElementById('importAccountDataModal'));
			modal.hide();
			loadAccountRecords(); // 重新加载数据
		} else {
			throw new Error(data.message || '导入失败');
		}
	})
	.catch(error => {
		console.error('导入数据失败:', error);
		showAlert('导入数据失败: ' + error.message, 'error');
	})
	.finally(() => {
		importBtn.innerHTML = originalText;
		importBtn.disabled = false;
	});
}

// 修改密码
function changePassword() {
	const modal = new bootstrap.Modal(document.getElementById('changePasswordModal'));
	modal.show();
}

// 保存密码
function savePassword() {
	const oldPassword = document.getElementById('oldPassword').value;
	const newPassword = document.getElementById('newPassword').value;
	const confirmPassword = document.getElementById('confirmPassword').value;
	
	if (!oldPassword || !newPassword || !confirmPassword) {
		showAlert('请填写所有密码字段', 'error');
		return;
	}
	
	if (newPassword !== confirmPassword) {
		showAlert('新密码和确认密码不一致', 'error');
		return;
	}
	
	if (newPassword.length < 6) {
		showAlert('新密码长度不能少于6位', 'error');
		return;
	}
	
	const saveBtn = document.getElementById('savePasswordBtn');
	const originalText = saveBtn.innerHTML;
	saveBtn.innerHTML = '<i class="bi bi-hourglass-split me-1"></i>保存中...';
	saveBtn.disabled = true;
	
	fetch('/api/change_password', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			old_password: oldPassword,
			new_password: newPassword
		})
	})
	.then(response => {
		if (!response.ok) {
			throw new Error('修改密码失败');
		}
		return response.json();
	})
	.then(data => {
		if (data.success) {
			showAlert('密码修改成功！', 'success');
			const modal = bootstrap.Modal.getInstance(document.getElementById('changePasswordModal'));
			modal.hide();
		} else {
			throw new Error(data.message || '修改密码失败');
		}
	})
	.catch(error => {
		console.error('修改密码失败:', error);
		showAlert('修改密码失败: ' + error.message, 'error');
	})
	.finally(() => {
		saveBtn.innerHTML = originalText;
		saveBtn.disabled = false;
	});
}

// 修改安全问题
function changeSecurityQuestion() {
	const modal = new bootstrap.Modal(document.getElementById('changeSecurityQuestionModal'));
	modal.show();
}

// 保存安全问题
function saveSecurityQuestion() {
	const currentPassword = document.getElementById('currentPassword').value;
	const newSecurityQuestion = document.getElementById('newSecurityQuestion').value;
	const newSecurityAnswer = document.getElementById('newSecurityAnswer').value;
	
	if (!currentPassword || !newSecurityQuestion || !newSecurityAnswer) {
		showAlert('请填写所有字段', 'error');
		return;
	}
	
	const saveBtn = document.getElementById('saveSecurityQuestionBtn');
	const originalText = saveBtn.innerHTML;
	saveBtn.innerHTML = '<i class="bi bi-hourglass-split me-1"></i>保存中...';
	saveBtn.disabled = true;
	
	fetch('/api/change_security_question', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			password: currentPassword,
			new_question: newSecurityQuestion,
			new_answer: newSecurityAnswer
		})
	})
	.then(response => {
		if (!response.ok) {
			throw new Error('修改安全问题失败');
		}
		return response.json();
	})
	.then(data => {
		if (data.success) {
			showAlert('安全问题修改成功！', 'success');
			const modal = bootstrap.Modal.getInstance(document.getElementById('changeSecurityQuestionModal'));
			modal.hide();
		} else {
			throw new Error(data.message || '修改安全问题失败');
		}
	})
	.catch(error => {
		console.error('修改安全问题失败:', error);
		showAlert('修改安全问题失败: ' + error.message, 'error');
	})
	.finally(() => {
		saveBtn.innerHTML = originalText;
		saveBtn.disabled = false;
	});
}

// 退出登录
function logout() {
	showConfirm('确定要退出系统吗？', function() {
		window.location.href = '/logout';
	});
}

// ==================== 系统日志功能 ====================

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

	if (!logs || logs.length === 0) {
		const tr = document.createElement('tr');
		tr.innerHTML = `<td colspan="7" class="text-center py-4 text-muted">暂无日志记录</td>`;
		tbody.appendChild(tr);
		return;
	}

	const startIndex = (currentLogPage - 1) * logsPerPage + 1;
	
	logs.forEach((log, index) => {
		const tr = document.createElement('tr');
		tr.innerHTML = `
			<td>${startIndex + index}</td>
			<td>${log.created_at}</td>
			<td><span class="badge bg-primary">${log.operation_type}</span></td>
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

	totalLogPages = data.total_pages || 1;
	totalLogs = data.total || 0;

	if (totalLogPages <= 1) return;

	// 首页按钮
	const firstLi = document.createElement('li');
	firstLi.className = `page-item ${currentLogPage === 1 ? 'disabled' : ''}`;
	firstLi.innerHTML = `
		<a class="page-link" href="#" aria-label="首页" onclick="changeLogPage(1)">
			<i class="bi bi-chevron-double-left"></i>
		</a>
	`;
	pagination.appendChild(firstLi);

	// 上一页按钮
	const prevLi = document.createElement('li');
	prevLi.className = `page-item ${currentLogPage === 1 ? 'disabled' : ''}`;
	prevLi.innerHTML = `
		<a class="page-link" href="#" aria-label="上一页" onclick="changeLogPage(${currentLogPage - 1})">
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
		pageLi.innerHTML = `<a class="page-link" href="#" onclick="changeLogPage(1)">1</a>`;
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
		pageLi.innerHTML = `<a class="page-link" href="#" onclick="changeLogPage(${i})">${i}</a>`;
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
		pageLi.innerHTML = `<a class="page-link" href="#" onclick="changeLogPage(${totalLogPages})">${totalLogPages}</a>`;
		pagination.appendChild(pageLi);
	}

	// 下一页按钮
	const nextLi = document.createElement('li');
	nextLi.className = `page-item ${currentLogPage === totalLogPages ? 'disabled' : ''}`;
	nextLi.innerHTML = `
		<a class="page-link" href="#" aria-label="下一页" onclick="changeLogPage(${currentLogPage + 1})">
			<i class="bi bi-chevron-right"></i>
		</a>
	`;
	pagination.appendChild(nextLi);

	// 尾页按钮
	const lastLi = document.createElement('li');
	lastLi.className = `page-item ${currentLogPage === totalLogPages ? 'disabled' : ''}`;
	lastLi.innerHTML = `
		<a class="page-link" href="#" aria-label="尾页" onclick="changeLogPage(${totalLogPages})">
			<i class="bi bi-chevron-double-right"></i>
		</a>
	`;
	pagination.appendChild(lastLi);

	// 更新日志跳转输入框
	updateLogPageJumpInput();
}

// 更新日志页码跳转输入框
function updateLogPageJumpInput() {
	const logPageJumpInput = document.getElementById('logPageJumpInput');
	if (!logPageJumpInput) return;
	
	logPageJumpInput.value = currentLogPage;
	logPageJumpInput.max = totalLogPages;
	logPageJumpInput.min = 1;
}

// 跳转到指定日志页面
function jumpToLogPage() {
	const logPageJumpInput = document.getElementById('logPageJumpInput');
	if (!logPageJumpInput) return;
	
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
	const logsPaginationInfo = document.getElementById('logsPaginationInfo');
	if (!logsPaginationInfo) return;
	
	const startItem = (currentLogPage - 1) * logsPerPage + 1;
	const endItem = Math.min(currentLogPage * logsPerPage, data.total || 0);
	logsPaginationInfo.textContent = 
		`显示 ${startItem}-${endItem} 条，共 ${data.total || 0} 条记录`;
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
			let logText = "家庭记账管理系统 - 操作日志\n";
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

// ==================== 类别管理功能 ====================

// 打开类别管理模态框
function openCategoriesModal() {
	loadCategoriesForEditing();
	const modal = new bootstrap.Modal(document.getElementById('categoriesModal'));
	modal.show();
}

// 加载类别用于编辑
async function loadCategoriesForEditing() {
	try {
		const response = await fetch('/api/account/categories');
		if (response.ok) {
			const categories = await response.json();
			editingCategories = categories;
		} else {
			// 如果API调用失败，使用默认类别
			editingCategories = [...defaultCategories];
		}
		renderCategoriesForEditing();
	} catch (error) {
		console.error('加载类别失败:', error);
		// 如果出现错误，使用默认类别
		editingCategories = [...defaultCategories];
		renderCategoriesForEditing();
		showAlert('加载类别失败，已使用默认类别', 'error');
	}
}

// 渲染编辑类别界面
function renderCategoriesForEditing() {
	const expenseContainer = document.getElementById('expenseCategoriesList');
	const incomeContainer = document.getElementById('incomeCategoriesList');
	
	expenseContainer.innerHTML = '';
	incomeContainer.innerHTML = '';
	
	const expenseCategories = editingCategories.filter(cat => cat.category_type === '支出');
	const incomeCategories = editingCategories.filter(cat => cat.category_type === '收入');
	
	// 渲染支出类别
	expenseCategories.forEach((category, index) => {
		const categoryHtml = createCategoryEditorHtml(category, index);
		expenseContainer.innerHTML += categoryHtml;
	});
	
	// 渲染收入类别
	incomeCategories.forEach((category, index) => {
		const categoryHtml = createCategoryEditorHtml(category, index);
		incomeContainer.innerHTML += categoryHtml;
	});
}

// 创建类别编辑器HTML
function createCategoryEditorHtml(category, index) {
	const subcategoriesText = category.subcategories ? category.subcategories.join(',') : '';
	
	return `
		<div class="card mb-2 category-editor" data-index="${index}">
			<div class="card-body py-2">
				<div class="row g-2 align-items-center">
					<div class="col-md-4">
						<input type="text" class="form-control form-control-sm category-name" 
							   value="${category.category_name}" placeholder="类别名称">
					</div>
					<div class="col-md-6">
						<input type="text" class="form-control form-control-sm subcategories" 
							   value="${subcategoriesText}" placeholder="子类别（用逗号分隔）">
					</div>
					<div class="col-md-2">
						<button type="button" class="btn btn-sm btn-outline-danger w-100 btn-sm-compact" onclick="removeCategory(${index})">
							<i class="bi bi-trash"></i>
						</button>
					</div>
				</div>
			</div>
		</div>
	`;
}

// 添加新类别
function addCategory(type) {
	const newCategory = {
		category_type: type,
		category_name: '',
		subcategories: [],
		sort_order: editingCategories.filter(cat => cat.category_type === type).length
	};
	
	editingCategories.push(newCategory);
	renderCategoriesForEditing();
}

// 删除类别
function removeCategory(index) {
	showConfirm('确定要删除这个类别吗？', function() {
		editingCategories.splice(index, 1);
		renderCategoriesForEditing();
	});
}

// 保存类别
async function saveCategories() {
	// 收集类别数据
	const categoryEditors = document.querySelectorAll('.category-editor');
	const updatedCategories = [];
	
	categoryEditors.forEach(editor => {
		const index = parseInt(editor.getAttribute('data-index'));
		const categoryName = editor.querySelector('.category-name').value.trim();
		const subcategoriesText = editor.querySelector('.subcategories').value.trim();
		
		if (categoryName) {
			const subcategories = subcategoriesText ? subcategoriesText.split(',').map(s => s.trim()).filter(s => s) : [];
			
			updatedCategories.push({
				category_type: editingCategories[index].category_type,
				category_name: categoryName,
				subcategories: subcategories,
				sort_order: index
			});
		}
	});
	
	if (updatedCategories.length === 0) {
		showAlert('请至少保留一个类别', 'error');
		return;
	}
	
	try {
		const response = await fetch('/api/account/categories', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ categories: updatedCategories })
		});
		
		const result = await response.json();
		if (result.success) {
			showAlert('类别保存成功！请刷新页面使更改生效', 'success');
			const modal = bootstrap.Modal.getInstance(document.getElementById('categoriesModal'));
			modal.hide();
		} else {
			showAlert(result.error || '保存失败', 'error');
		}
	} catch (error) {
		console.error('保存类别失败:', error);
		showAlert('保存失败，请检查网络连接', 'error');
	}
}

// 重置类别
async function resetCategories() {
	showConfirm('确定要重置为默认类别吗？这将删除所有自定义类别。', function() {
		resetCategoriesConfirmed();
	});
}

async function resetCategoriesConfirmed() {
	try {
		const response = await fetch('/api/account/categories/reset', {
			method: 'POST'
		});
		
		const result = await response.json();
		if (result.success) {
			showAlert('类别重置成功！请刷新页面使更改生效', 'success');
			const modal = bootstrap.Modal.getInstance(document.getElementById('categoriesModal'));
			modal.hide();
		} else {
			showAlert(result.error || '重置失败', 'error');
		}
	} catch (error) {
		console.error('重置类别失败:', error);
		showAlert('重置失败，请检查网络连接', 'error');
	}
}

// ==================== 图表功能 ====================

// 加载图表数据
function loadChartData() {
	// 获取筛选条件
	const startDate = document.getElementById('statisticsStartDate').value;
	const endDate = document.getElementById('statisticsEndDate').value;
	const owner = document.getElementById('statisticsOwner').value;
	
	// 构建查询参数
	const params = new URLSearchParams({
		start_date: startDate,
		end_date: endDate,
		owner: owner
	});

	// 获取图表数据
	fetch(`/api/account/statistics/charts?${params}`)
		.then(response => {
			if (!response.ok) {
				throw new Error('获取图表数据失败');
			}
			return response.json();
		})
		.then(data => {
			renderCharts(data);
		})
		.catch(error => {
			console.error('获取图表数据失败:', error);
			// 如果没有后端API支持，使用模拟数据
			renderCharts(generateMockChartData());
		});
}

// 生成模拟图表数据（在没有后端API时使用）
function generateMockChartData() {
	const currentYear = new Date().getFullYear();
	const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
	const quarters = ['第一季度', '第二季度', '第三季度', '第四季度'];
	const years = [currentYear - 2, currentYear - 1, currentYear];
	const expenseCategories = ['餐饮', '交通', '购物', '娱乐', '医疗', '教育', '住房', '其他'];
	const incomeCategories = ['工资收入', '投资收益', '其他收入'];
	
	// 生成更真实的模拟数据
	const monthlyData = {
		labels: months,
		income: months.map((_, i) => Math.floor(Math.random() * 8000) + 5000 + i * 200),
		expense: months.map((_, i) => Math.floor(Math.random() * 6000) + 3000 + i * 150)
	};
	
	const quarterlyData = {
		labels: quarters,
		income: quarters.map(() => Math.floor(Math.random() * 25000) + 15000),
		expense: quarters.map(() => Math.floor(Math.random() * 20000) + 10000)
	};
	
	const yearlyData = {
		labels: years.map(y => `${y}年`),
		income: years.map((_, i) => Math.floor(Math.random() * 100000) + 60000 + i * 20000),
		expense: years.map((_, i) => Math.floor(Math.random() * 80000) + 50000 + i * 15000)
	};
	
	const categoryData = {
		expense: {
			labels: expenseCategories,
			data: expenseCategories.map(() => Math.floor(Math.random() * 20000) + 5000)
		},
		income: {
			labels: incomeCategories,
			data: incomeCategories.map(() => Math.floor(Math.random() * 50000) + 20000)
		}
	};
	
	const comparisonData = {
		balance: {
			labels: months,
			income: monthlyData.income,
			expense: monthlyData.expense,
			net: monthlyData.income.map((income, i) => income - monthlyData.expense[i])
		},
		owners: {
			labels: ['郭宁', '李佳慧'],
			income: [Math.floor(Math.random() * 80000) + 40000, Math.floor(Math.random() * 60000) + 30000],
			expense: [Math.floor(Math.random() * 60000) + 30000, Math.floor(Math.random() * 40000) + 20000]
		}
	};

	return {
		monthly: monthlyData,
		quarterly: quarterlyData,
		yearly: yearlyData,
		category: categoryData,
		comparison: comparisonData
	};
}

// 生成模拟类别数据
function generateMockCategoryData(timeRange) {
	const expenseCategories = ['餐饮', '交通', '购物', '娱乐', '医疗', '教育', '住房', '其他'];
	const incomeCategories = ['工资收入', '投资收益', '其他收入'];
	
	if (timeRange === 'all') {
		return {
			expense: {
				labels: expenseCategories,
				data: expenseCategories.map(() => Math.floor(Math.random() * 20000) + 5000)
			},
			income: {
				labels: incomeCategories,
				data: incomeCategories.map(() => Math.floor(Math.random() * 50000) + 20000)
			}
		};
	}
	
	// 其他时间范围的模拟数据
	return {
		expense: {
			labels: expenseCategories,
			datasets: [
				{
					label: '当前期间',
					data: expenseCategories.map(() => Math.floor(Math.random() * 20000) + 5000)
				}
			]
		},
		income: {
			labels: incomeCategories,
			datasets: [
				{
					label: '当前期间',
					data: incomeCategories.map(() => Math.floor(Math.random() * 50000) + 20000)
				}
			]
		}
	};
}

// 渲染所有图表
function renderCharts(data) {
	// 销毁现有图表
	destroyCharts();
	
	// 渲染月度趋势图
	renderMonthlyTrendChart(data.monthly);
	
	// 渲染季度对比图
	renderQuarterlyComparisonChart(data.quarterly);
	
	// 渲染年度分析图
	renderYearlyAnalysisChart(data.yearly);
	
	// 渲染类别分布图
	renderCategoryDistributionChart(data.category);
	
	// 渲染收支对比图
	renderComparisonCharts(data.comparison);
	
	// 加载类别统计图表（根据当前选择的时间维度）
	loadCategoryCharts();
}

// 销毁所有图表
function destroyCharts() {
	Object.values(chartInstances).forEach(chart => {
		if (chart) {
			chart.destroy();
		}
	});
	chartInstances = {};
}

// 渲染月度趋势图
function renderMonthlyTrendChart(data) {
	const ctx = document.getElementById('monthlyTrendChart').getContext('2d');
	
	chartInstances.monthlyTrend = new Chart(ctx, {
		type: currentChartType === 'pie' ? 'line' : currentChartType, // 饼图不适合趋势数据，强制使用折线图
		data: {
			labels: data.labels,
			datasets: [
				{
					label: '收入',
					data: data.income,
					borderColor: '#2ecc71',
					backgroundColor: currentChartType === 'line' ? 'transparent' : 'rgba(46, 204, 113, 0.5)',
					tension: 0.4,
					fill: currentChartType === 'line'
				},
				{
					label: '支出',
					data: data.expense,
					borderColor: '#e74c3c',
					backgroundColor: currentChartType === 'line' ? 'transparent' : 'rgba(231, 76, 60, 0.5)',
					tension: 0.4,
					fill: currentChartType === 'line'
				}
			]
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			plugins: {
				title: {
					display: true,
					text: '月度收支趋势',
					color: '#212529',
					font: {
						size: 16
					}
				},
				legend: {
					labels: {
						color: '#212529'
					}
				},
				tooltip: {
					callbacks: {
						label: function(context) {
							return `${context.dataset.label}: ¥${context.parsed.y.toLocaleString()}`;
						}
					}
				}
			},
			scales: {
				x: {
					grid: {
						color: 'rgba(0, 0, 0, 0.1)'
					},
					ticks: {
						color: '#6c757d'
					}
				},
				y: {
					grid: {
						color: 'rgba(0, 0, 0, 0.1)'
					},
					ticks: {
						color: '#6c757d',
						callback: function(value) {
							return '¥' + value.toLocaleString();
						}
					}
				}
			}
		}
	});
}

// 渲染季度对比图
function renderQuarterlyComparisonChart(data) {
	const ctx = document.getElementById('quarterlyComparisonChart').getContext('2d');
	
	chartInstances.quarterlyComparison = new Chart(ctx, {
		type: currentChartType === 'pie' ? 'bar' : currentChartType,
		data: {
			labels: data.labels,
			datasets: [
				{
					label: '收入',
					data: data.income,
					backgroundColor: 'rgba(52, 152, 219, 0.7)',
					borderColor: '#3498db',
					borderWidth: 2
				},
				{
					label: '支出',
					data: data.expense,
					backgroundColor: 'rgba(231, 76, 60, 0.7)',
					borderColor: '#e74c3c',
					borderWidth: 2
				}
			]
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			plugins: {
				title: {
					display: true,
					text: '季度收支对比',
					color: '#212529',
					font: {
						size: 16
					}
				},
				legend: {
					labels: {
						color: '#212529'
					}
				},
				tooltip: {
					callbacks: {
						label: function(context) {
							return `${context.dataset.label}: ¥${context.parsed.y.toLocaleString()}`;
						}
					}
				}
			},
			scales: {
				x: {
					grid: {
						color: 'rgba(0, 0, 0, 0.1)'
					},
					ticks: {
						color: '#6c757d'
					}
				},
				y: {
					grid: {
						color: 'rgba(0, 0, 0, 0.1)'
					},
					ticks: {
						color: '#6c757d',
						callback: function(value) {
							return '¥' + value.toLocaleString();
						}
					}
				}
			}
		}
	});
}

// 渲染年度分析图
function renderYearlyAnalysisChart(data) {
	const ctx = document.getElementById('yearlyAnalysisChart').getContext('2d');
	
	// 计算净收入
	const netIncome = data.income.map((income, index) => income - data.expense[index]);
	
	chartInstances.yearlyAnalysis = new Chart(ctx, {
		type: currentChartType === 'pie' ? 'bar' : currentChartType,
		data: {
			labels: data.labels,
			datasets: [
				{
					label: '收入',
					data: data.income,
					backgroundColor: 'rgba(46, 204, 113, 0.7)',
					borderColor: '#2ecc71',
					borderWidth: 2
				},
				{
					label: '支出',
					data: data.expense,
					backgroundColor: 'rgba(231, 76, 60, 0.7)',
					borderColor: '#e74c3c',
					borderWidth: 2
				},
				{
					label: '净收入',
					data: netIncome,
					backgroundColor: 'rgba(155, 89, 182, 0.7)',
					borderColor: '#9b59b6',
					borderWidth: 2,
					type: currentChartType === 'bar' ? 'line' : currentChartType
				}
			]
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			plugins: {
				title: {
					display: true,
					text: '年度收支分析',
					color: '#212529',
					font: {
						size: 16
					}
				},
				legend: {
					labels: {
						color: '#212529'
					}
				},
				tooltip: {
					callbacks: {
						label: function(context) {
							return `${context.dataset.label}: ¥${context.parsed.y.toLocaleString()}`;
						}
					}
				}
			},
			scales: {
				x: {
					grid: {
						color: 'rgba(0, 0, 0, 0.1)'
					},
					ticks: {
						color: '#6c757d'
					}
				},
				y: {
					grid: {
						color: 'rgba(0, 0, 0, 0.1)'
					},
					ticks: {
						color: '#6c757d',
						callback: function(value) {
							return '¥' + value.toLocaleString();
						}
					}
				}
			}
		}
	});
}

// 渲染类别分布图
function renderCategoryDistributionChart(data) {
	// 检查支出数据
	if (data.expense && data.expense.labels && data.expense.labels.length > 0) {
		const expenseCtx = document.getElementById('categoryDistributionChart').getContext('2d');
		
		chartInstances.categoryDistributionChart = new Chart(expenseCtx, {
			type: currentChartType === 'line' ? 'bar' : currentChartType,
			data: {
				labels: data.expense.labels,
				datasets: [
					{
						label: '支出金额',
						data: data.expense.data,
						backgroundColor: generateColors(data.expense.labels.length),
						borderColor: 'rgba(0, 0, 0, 0.1)',
						borderWidth: 2
					}
				]
			},
			options: getCategoryChartOptions('支出类别分布')
		});
	}
	
	// 检查收入数据
	if (data.income && data.income.labels && data.income.labels.length > 0) {
		const incomeCtx = document.getElementById('incomeCategoryChart').getContext('2d');
		
		chartInstances.incomeCategoryChart = new Chart(incomeCtx, {
			type: currentChartType === 'line' ? 'bar' : currentChartType,
			data: {
				labels: data.income.labels,
				datasets: [
					{
						label: '收入金额',
						data: data.income.data,
						backgroundColor: generateColors(data.income.labels.length),
						borderColor: 'rgba(0, 0, 0, 0.1)',
						borderWidth: 2
					}
				]
			},
			options: getCategoryChartOptions('收入类别分布')
		});
	}
}

// 切换类别统计时间维度
function switchCategoryTimeRange(range) {
	currentCategoryTimeRange = range;
	
	// 更新按钮状态
	document.querySelectorAll('#categoryTimeTabs .nav-link').forEach(btn => {
		btn.classList.remove('active');
	});
	event.target.classList.add('active');
	
	// 重新加载类别统计图表
	loadCategoryCharts();
}

// 加载类别统计图表
// 修改 loadCategoryCharts 函数中获取当前激活选项卡的逻辑
function loadCategoryCharts() {
	try {
		const startDate = document.getElementById('statisticsStartDate').value;
		const endDate = document.getElementById('statisticsEndDate').value;
		const owner = document.getElementById('statisticsOwner').value;
		
		// 使用全局变量 currentCategoryTimeRange，而不是从DOM获取
		const timeRange = currentCategoryTimeRange || 'all';
		
		console.log('正在加载类别统计数据...', { 
			startDate, 
			endDate, 
			owner, 
			timeRange, 
			chartType: currentChartType
		});
		
		// 构建查询参数
		const params = new URLSearchParams({
			start_date: startDate,
			end_date: endDate,
			owner: owner,
			time_range: timeRange
		});
		
		console.log('API请求URL:', `/api/account/statistics/categories?${params}`);
		
		// 获取类别统计数据
		fetch(`/api/account/statistics/categories?${params}`)
			.then(response => {
				console.log('API响应状态:', response.status, response.statusText);
				if (!response.ok) {
					return response.json().then(errorData => {
						console.error('API返回错误:', errorData);
						throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
					});
				}
				return response.json();
			})
			.then(data => {
				console.log('接收到类别统计数据:', {
					timeRange: timeRange,
					hasExpenseData: !!(data.expense),
					expenseLabelsCount: data.expense ? data.expense.labels.length : 0,
					expenseData: data.expense && data.expense.data ? data.expense.data : '没有data字段',
					expenseDatasets: data.expense && data.expense.datasets ? data.expense.datasets : '没有datasets字段'
				});
				renderCategoryCharts(data);
			})
			.catch(error => {
				console.error('获取类别统计数据失败:', error);
				showAlert('获取类别统计数据失败，请稍后重试', 'error');
				renderEmptyCategoryCharts();
			});
	} catch (error) {
		console.error('加载类别图表时发生错误:', error);
		showAlert('加载类别图表时发生错误，请稍后重试', 'error');
		renderEmptyCategoryCharts();
	}
}

// 添加空数据图表渲染函数
function renderEmptyCategoryCharts() {
	console.log('渲染空数据图表');
	
	const emptyData = {
		expense: {
			labels: ['暂无数据'],
			data: [0]
		},
		income: {
			labels: ['暂无数据'],
			data: [0]
		}
	};
	
	renderCategoryCharts(emptyData);
}

// 生成模拟类别数据（简化版）
function generateMockCategoryData(timeRange) {
	console.log('生成模拟数据，时间范围:', timeRange);
	
	const expenseCategories = ['餐饮', '交通', '购物', '娱乐', '医疗', '教育', '住房', '其他'];
	const incomeCategories = ['工资收入', '投资收益', '其他收入'];
	
	// 生成随机数据
	const expenseData = expenseCategories.map(() => Math.floor(Math.random() * 20000) + 5000);
	const incomeData = incomeCategories.map(() => Math.floor(Math.random() * 50000) + 20000);
	
	return {
		expense: {
			labels: expenseCategories,
			data: expenseData
		},
		income: {
			labels: incomeCategories,
			data: incomeData
		}
	};
}

// 渲染类别统计图表
function renderCategoryCharts(data) {
	console.log('开始渲染类别统计图表:', data);
	
	// 销毁现有的类别统计图表
	const categoryChartIds = [
		'categoryDistributionChart', 'incomeCategoryChart',
		'yearlyExpenseCategoryChart', 'yearlyIncomeCategoryChart',
		'quarterlyExpenseCategoryChart', 'quarterlyIncomeCategoryChart',
		'monthlyExpenseCategoryChart', 'monthlyIncomeCategoryChart'
	];
	
	categoryChartIds.forEach(chartId => {
		if (chartInstances[chartId]) {
			chartInstances[chartId].destroy();
			delete chartInstances[chartId];
		}
	});
	
	// 检查数据是否为空
	if (!data || Object.keys(data).length === 0) {
		console.warn('没有找到类别统计数据');
		showAlert('没有找到类别统计数据', 'info');
		return;
	}
	
	// 根据当前选择的时间维度渲染对应的图表
	switch(currentCategoryTimeRange) {
		case 'all':
			renderAllCategoryCharts(data);
			break;
		case 'yearly':
			renderYearlyCategoryCharts(data);
			break;
		case 'quarterly':
			renderQuarterlyCategoryCharts(data);
			break;
		case 'monthly':
			renderMonthlyCategoryCharts(data);
			break;
		default:
			renderAllCategoryCharts(data);
	}
	
	console.log('类别统计图表渲染完成');
}

// 渲染全部数据类别图表
// 渲染全部数据类别图表
function renderAllCategoryCharts(data) {
	console.log('渲染全部数据类别图表 - 数据:', data);
	
	try {
		// ==================== 处理支出图表 ====================
		const expenseChartElement = document.getElementById('categoryDistributionChart');
		if (!expenseChartElement) {
			console.error('支出类别图表容器不存在，尝试创建');
			// 尝试查找容器
			const expenseContainer = document.querySelector('#category-all-pane .chart-container:first-child canvas');
			if (!expenseContainer) {
				console.error('无法找到支出图表容器');
				return;
			}
		}
		
		// 检查数据
		if (!data || !data.expense) {
			console.warn('支出类别数据格式不正确');
			expenseChartElement.parentElement.innerHTML = 
				'<div class="text-center py-4 text-muted">暂无支出类别数据</div>';
			return;
		}
		
		const expenseCtx = expenseChartElement.getContext('2d');
		
		// 处理不同的数据结构
		let labels = [];
		let dataValues = [];
		
		// 情况1：有datasets字段
		if (data.expense.datasets && Array.isArray(data.expense.datasets)) {
			labels = data.expense.labels || [];
			const dataset = data.expense.datasets[0] || {};
			if (dataset.data && Array.isArray(dataset.data)) {
				dataValues = dataset.data.map(item => {
					if (typeof item === 'object' && item !== null) {
						return parseFloat(item.total_amount || item.amount || item.value || 0);
					}
					return parseFloat(item || 0);
				});
			}
		} 
		// 情况2：有data字段
		else if (data.expense.data && Array.isArray(data.expense.data)) {
			labels = data.expense.labels || [];
			dataValues = data.expense.data.map(item => {
				if (typeof item === 'object' && item !== null) {
					return parseFloat(item.total_amount || item.amount || item.value || 0);
				}
				return parseFloat(item || 0);
			});
		}
		// 情况3：没有数据
		else {
			labels = ['暂无数据'];
			dataValues = [0];
		}
		
		console.log('支出图表数据:', { labels, dataValues });
		
		// 销毁现有图表实例
		if (chartInstances.categoryDistributionChart) {
			chartInstances.categoryDistributionChart.destroy();
		}
		
		// 决定图表类型：如果是折线图，使用柱状图（因为类别数据不适合折线图）
		let chartType = currentChartType;
		if (chartType === 'line') {
			chartType = 'bar'; // 类别数据使用柱状图更合适
		}
		
		// 生成颜色
		const colors = generateColors(labels.length);
		
		// 创建图表
		chartInstances.categoryDistributionChart = new Chart(expenseCtx, {
			type: chartType,
			data: {
				labels: labels,
				datasets: [{
					label: '支出金额',
					data: dataValues,
					backgroundColor: colors,
					borderColor: 'rgba(0, 0, 0, 0.1)',
					borderWidth: 2
				}]
			},
			options: getCategoryChartOptions('支出类别分布（全部数据）', chartType)
		});
		
		// ==================== 处理收入图表 ====================
		const incomeChartElement = document.getElementById('incomeCategoryChart');
		if (!incomeChartElement) {
			console.error('收入类别图表容器不存在');
			return;
		}
		
		// 检查数据
		if (!data.income) {
			console.warn('收入类别数据格式不正确');
			incomeChartElement.parentElement.innerHTML = 
				'<div class="text-center py-4 text-muted">暂无收入类别数据</div>';
			return;
		}
		
		const incomeCtx = incomeChartElement.getContext('2d');
		
		// 处理收入数据
		let incomeLabels = [];
		let incomeDataValues = [];
		
		// 情况1：有datasets字段
		if (data.income.datasets && Array.isArray(data.income.datasets)) {
			incomeLabels = data.income.labels || [];
			const dataset = data.income.datasets[0] || {};
			if (dataset.data && Array.isArray(dataset.data)) {
				incomeDataValues = dataset.data.map(item => {
					if (typeof item === 'object' && item !== null) {
						return parseFloat(item.total_amount || item.amount || item.value || 0);
					}
					return parseFloat(item || 0);
				});
			}
		} 
		// 情况2：有data字段
		else if (data.income.data && Array.isArray(data.income.data)) {
			incomeLabels = data.income.labels || [];
			incomeDataValues = data.income.data.map(item => {
				if (typeof item === 'object' && item !== null) {
					return parseFloat(item.total_amount || item.amount || item.value || 0);
				}
				return parseFloat(item || 0);
			});
		}
		// 情况3：没有数据
		else {
			incomeLabels = ['暂无数据'];
			incomeDataValues = [0];
		}
		
		console.log('收入图表数据:', { incomeLabels, incomeDataValues });
		
		// 销毁现有图表实例
		if (chartInstances.incomeCategoryChart) {
			chartInstances.incomeCategoryChart.destroy();
		}
		
		// 生成颜色
		const incomeColors = generateColors(incomeLabels.length);
		
		// 创建图表
		chartInstances.incomeCategoryChart = new Chart(incomeCtx, {
			type: chartType,
			data: {
				labels: incomeLabels,
				datasets: [{
					label: '收入金额',
					data: incomeDataValues,
					backgroundColor: incomeColors,
					borderColor: 'rgba(0, 0, 0, 0.1)',
					borderWidth: 2
				}]
			},
			options: getCategoryChartOptions('收入类别分布（全部数据）', chartType)
		});
		
		console.log('全部数据类别图表渲染完成');
		
	} catch (error) {
		console.error('渲染类别图表时出错:', error);
		// 显示错误信息
		const expenseChartElement = document.getElementById('categoryDistributionChart');
		const incomeChartElement = document.getElementById('incomeCategoryChart');
		
		if (expenseChartElement && expenseChartElement.parentElement) {
			expenseChartElement.parentElement.innerHTML = 
				'<div class="text-center py-4 text-danger">图表渲染错误: ' + error.message + '</div>';
		}
		if (incomeChartElement && incomeChartElement.parentElement) {
			incomeChartElement.parentElement.innerHTML = 
				'<div class="text-center py-4 text-danger">图表渲染错误: ' + error.message + '</div>';
		}
	}
}
// 渲染年度类别图表
// 渲染年度类别图表
// 渲染年度类别图表
function renderYearlyCategoryCharts(data) {
	console.log('渲染年度类别图表', data);
	
	// 检查支出数据和图表容器是否存在
	const expenseChartElement = document.getElementById('yearlyExpenseCategoryChart');
	if (!expenseChartElement) {
		console.error('年度支出图表容器不存在');
		return;
	}
	
	// 检查数据是否存在
	if (!data || !data.expense) {
		console.error('年度支出数据格式不正确', data);
		expenseChartElement.parentElement.innerHTML = 
			'<div class="text-center py-4 text-muted">暂无年度支出类别数据</div>';
		return;
	}
	
	const expenseCtx = expenseChartElement.getContext('2d');
	
	// 获取数据
	const expenseLabels = data.expense.labels || [];
	const expenseDatasets = data.expense.datasets || [];
	
	// 生成颜色
	const colors = generateColors(expenseDatasets.length);
	
	// 为每个数据集添加颜色
	expenseDatasets.forEach((dataset, index) => {
		dataset.backgroundColor = colors[index];
		dataset.borderColor = colors[index];
		dataset.borderWidth = 2;
		dataset.fill = false;
	});
	
	// 销毁现有图表实例
	if (chartInstances.yearlyExpenseCategoryChart) {
		chartInstances.yearlyExpenseCategoryChart.destroy();
	}
	
	chartInstances.yearlyExpenseCategoryChart = new Chart(expenseCtx, {
		type: 'bar', // 类别统计使用柱状图
		data: {
			labels: expenseLabels,
			datasets: expenseDatasets
		},
		options: getComparisonChartOptions('年度支出类别对比')
	});
	
	// ==================== 处理收入图表 ====================
	const incomeChartElement = document.getElementById('yearlyIncomeCategoryChart');
	if (!incomeChartElement) {
		console.error('年度收入图表容器不存在');
		return;
	}
	
	// 检查数据是否存在
	if (!data.income) {
		console.error('年度收入数据格式不正确', data);
		incomeChartElement.parentElement.innerHTML = 
			'<div class="text-center py-4 text-muted">暂无年度收入类别数据</div>';
		return;
	}
	
	const incomeCtx = incomeChartElement.getContext('2d');
	
	// 获取数据
	const incomeLabels = data.income.labels || [];
	const incomeDatasets = data.income.datasets || [];
	
	// 生成颜色
	const incomeColors = generateColors(incomeDatasets.length);
	
	// 为每个数据集添加颜色
	incomeDatasets.forEach((dataset, index) => {
		dataset.backgroundColor = incomeColors[index];
		dataset.borderColor = incomeColors[index];
		dataset.borderWidth = 2;
		dataset.fill = false;
	});
	
	// 销毁现有图表实例
	if (chartInstances.yearlyIncomeCategoryChart) {
		chartInstances.yearlyIncomeCategoryChart.destroy();
	}
	
	chartInstances.yearlyIncomeCategoryChart = new Chart(incomeCtx, {
		type: 'bar', // 类别统计使用柱状图
		data: {
			labels: incomeLabels,
			datasets: incomeDatasets
		},
		options: getComparisonChartOptions('年度收入类别对比')
	});
}

// 渲染季度类别图表
// 渲染季度类别图表
function renderQuarterlyCategoryCharts(data) {
	console.log('渲染季度类别图表', data);
	
	// 检查支出数据和图表容器是否存在
	const expenseChartElement = document.getElementById('quarterlyExpenseCategoryChart');
	if (!expenseChartElement) {
		console.error('季度支出图表容器不存在');
		return;
	}
	
	// 检查数据是否存在
	if (!data || !data.expense) {
		console.error('季度支出数据格式不正确', data);
		expenseChartElement.parentElement.innerHTML = 
			'<div class="text-center py-4 text-muted">暂无季度支出类别数据</div>';
		return;
	}
	
	const expenseCtx = expenseChartElement.getContext('2d');
	
	// 获取数据
	const expenseLabels = data.expense.labels || [];
	const expenseDatasets = data.expense.datasets || [];
	
	// 生成颜色
	const colors = generateColors(expenseDatasets.length);
	
	// 为每个数据集添加颜色
	expenseDatasets.forEach((dataset, index) => {
		dataset.backgroundColor = colors[index];
		dataset.borderColor = colors[index];
		dataset.borderWidth = 2;
		dataset.fill = false;
	});
	
	// 销毁现有图表实例
	if (chartInstances.quarterlyExpenseCategoryChart) {
		chartInstances.quarterlyExpenseCategoryChart.destroy();
	}
	
	chartInstances.quarterlyExpenseCategoryChart = new Chart(expenseCtx, {
		type: 'bar',
		data: {
			labels: expenseLabels,
			datasets: expenseDatasets
		},
		options: getComparisonChartOptions('季度支出类别对比')
	});
	
	// ==================== 处理收入图表 ====================
	const incomeChartElement = document.getElementById('quarterlyIncomeCategoryChart');
	if (!incomeChartElement) {
		console.error('季度收入图表容器不存在');
		return;
	}
	
	// 检查数据是否存在
	if (!data.income) {
		console.error('季度收入数据格式不正确', data);
		incomeChartElement.parentElement.innerHTML = 
			'<div class="text-center py-4 text-muted">暂无季度收入类别数据</div>';
		return;
	}
	
	const incomeCtx = incomeChartElement.getContext('2d');
	
	// 获取数据
	const incomeLabels = data.income.labels || [];
	const incomeDatasets = data.income.datasets || [];
	
	// 生成颜色
	const incomeColors = generateColors(incomeDatasets.length);
	
	// 为每个数据集添加颜色
	incomeDatasets.forEach((dataset, index) => {
		dataset.backgroundColor = incomeColors[index];
		dataset.borderColor = incomeColors[index];
		dataset.borderWidth = 2;
		dataset.fill = false;
	});
	
	// 销毁现有图表实例
	if (chartInstances.quarterlyIncomeCategoryChart) {
		chartInstances.quarterlyIncomeCategoryChart.destroy();
	}
	
	chartInstances.quarterlyIncomeCategoryChart = new Chart(incomeCtx, {
		type: 'bar',
		data: {
			labels: incomeLabels,
			datasets: incomeDatasets
		},
		options: getComparisonChartOptions('季度收入类别对比')
	});
}

// 渲染月度类别图表
function renderMonthlyCategoryCharts(data) {
	console.log('渲染月度类别图表', data);
	
	// 检查支出数据和图表容器是否存在
	const expenseChartElement = document.getElementById('monthlyExpenseCategoryChart');
	if (!expenseChartElement) {
		console.error('月度支出图表容器不存在');
		return;
	}
	
	// 检查数据是否存在
	if (!data || !data.expense) {
		console.error('月度支出数据格式不正确', data);
		expenseChartElement.parentElement.innerHTML = 
			'<div class="text-center py-4 text-muted">暂无月度支出类别数据</div>';
		return;
	}
	
	const expenseCtx = expenseChartElement.getContext('2d');
	
	// 获取数据
	const expenseLabels = data.expense.labels || [];
	const expenseDatasets = data.expense.datasets || [];
	
	// 生成颜色
	const colors = generateColors(expenseDatasets.length);
	
	// 为每个数据集添加颜色
	expenseDatasets.forEach((dataset, index) => {
		dataset.backgroundColor = colors[index];
		dataset.borderColor = colors[index];
		dataset.borderWidth = 2;
		dataset.fill = false;
	});
	
	// 销毁现有图表实例
	if (chartInstances.monthlyExpenseCategoryChart) {
		chartInstances.monthlyExpenseCategoryChart.destroy();
	}
	
	chartInstances.monthlyExpenseCategoryChart = new Chart(expenseCtx, {
		type: 'bar',
		data: {
			labels: expenseLabels,
			datasets: expenseDatasets
		},
		options: getComparisonChartOptions('月度支出类别对比')
	});
	
	// ==================== 处理收入图表 ====================
	const incomeChartElement = document.getElementById('monthlyIncomeCategoryChart');
	if (!incomeChartElement) {
		console.error('月度收入图表容器不存在');
		return;
	}
	
	// 检查数据是否存在
	if (!data.income) {
		console.error('月度收入数据格式不正确', data);
		incomeChartElement.parentElement.innerHTML = 
			'<div class="text-center py-4 text-muted">暂无月度收入类别数据</div>';
		return;
	}
	
	const incomeCtx = incomeChartElement.getContext('2d');
	
	// 获取数据
	const incomeLabels = data.income.labels || [];
	const incomeDatasets = data.income.datasets || [];
	
	// 生成颜色
	const incomeColors = generateColors(incomeDatasets.length);
	
	// 为每个数据集添加颜色
	incomeDatasets.forEach((dataset, index) => {
		dataset.backgroundColor = incomeColors[index];
		dataset.borderColor = incomeColors[index];
		dataset.borderWidth = 2;
		dataset.fill = false;
	});
	
	// 销毁现有图表实例
	if (chartInstances.monthlyIncomeCategoryChart) {
		chartInstances.monthlyIncomeCategoryChart.destroy();
	}
	
	chartInstances.monthlyIncomeCategoryChart = new Chart(incomeCtx, {
		type: 'bar',
		data: {
			labels: incomeLabels,
			datasets: incomeDatasets
		},
		options: getComparisonChartOptions('月度收入类别对比')
	});
}

// 生成颜色数组
function generateColors(count) {
	const colors = [
		'#3498db', '#2ecc71', '#e74c3c', '#f39c12', 
		'#9b59b6', '#1abc9c', '#34495e', '#95a5a6',
		'#2980b9', '#27ae60', '#c0392b', '#d35400',
		'#8e44ad', '#16a085', '#2c3e50', '#7f8c8d'
	];
	
	if (count <= colors.length) {
		return colors.slice(0, count);
	}
	
	// 如果需要的颜色超过预设，生成随机颜色
	const result = [...colors];
	for (let i = colors.length; i < count; i++) {
		const hue = Math.floor(Math.random() * 360);
		result.push(`hsl(${hue}, 70%, 60%)`);
	}
	return result;
}

// 渲染收支对比图
function renderComparisonCharts(data) {
	// 收支平衡分析
	const balanceCtx = document.getElementById('balanceAnalysisChart').getContext('2d');
	
	chartInstances.balanceAnalysis = new Chart(balanceCtx, {
		type: 'line',
		data: {
			labels: data.balance.labels,
			datasets: [
				{
					label: '收入',
					data: data.balance.income,
					borderColor: '#2ecc71',
					backgroundColor: 'transparent',
					tension: 0.4
				},
				{
					label: '支出',
					data: data.balance.expense,
					borderColor: '#e74c3c',
					backgroundColor: 'transparent',
					tension: 0.4
				},
				{
					label: '净收入',
					data: data.balance.net,
					borderColor: '#3498db',
					backgroundColor: 'transparent',
					tension: 0.4,
					borderDash: [5, 5]
				}
			]
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			plugins: {
				title: {
					display: true,
					text: '收支平衡分析',
					color: '#f1f5f9',
					font: {
						size: 16
					}
				},
				legend: {
					labels: {
						color: '#f1f5f9'
					}
				},
				tooltip: {
					callbacks: {
						label: function(context) {
							return `${context.dataset.label}: ¥${context.parsed.y.toLocaleString()}`;
						}
					}
				}
			},
			scales: {
				x: {
					grid: {
						color: 'rgba(255, 255, 255, 0.1)'
					},
					ticks: {
						color: '#94a3b8'
					}
				},
				y: {
					grid: {
						color: 'rgba(255, 255, 255, 0.1)'
					},
					ticks: {
						color: '#94a3b8',
						callback: function(value) {
							return '¥' + value.toLocaleString();
						}
					}
				}
			}
		}
	});
	
	// 所属人收支对比
	const ownerCtx = document.getElementById('ownerComparisonChart').getContext('2d');
	
	chartInstances.ownerComparison = new Chart(ownerCtx, {
		type: 'bar',
		data: {
			labels: data.owners.labels,
			datasets: [
				{
					label: '收入',
					data: data.owners.income,
					backgroundColor: 'rgba(46, 204, 113, 0.7)',
					borderColor: '#2ecc71',
					borderWidth: 2
				},
				{
					label: '支出',
					data: data.owners.expense,
					backgroundColor: 'rgba(231, 76, 60, 0.7)',
					borderColor: '#e74c3c',
					borderWidth: 2
				}
			]
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			plugins: {
				title: {
					display: true,
					text: '所属人收支对比',
					color: '#f1f5f9',
					font: {
						size: 16
					}
				},
				legend: {
					labels: {
						color: '#f1f5f9'
					}
				},
				tooltip: {
					callbacks: {
						label: function(context) {
							return `${context.dataset.label}: ¥${context.parsed.y.toLocaleString()}`;
						}
					}
				}
			},
			scales: {
				x: {
					grid: {
						color: 'rgba(255, 255, 255, 0.1)'
					},
					ticks: {
						color: '#94a3b8'
					}
				},
				y: {
					grid: {
						color: 'rgba(255, 255, 255, 0.1)'
					},
					ticks: {
						color: '#94a3b8',
						callback: function(value) {
							return '¥' + value.toLocaleString();
						}
					}
				}
			}
		}
	});
}

// 切换图表类型
function switchChartType(type) {
	currentChartType = type;
	
	console.log('切换图表类型为:', type);
	
	// 更新按钮状态
	document.querySelectorAll('.chart-type-btn').forEach(btn => {
		btn.classList.remove('active');
		if (btn.getAttribute('data-chart-type') === type) {
			btn.classList.add('active');
		}
	});
	
	// 重新加载当前激活的图表
	if (document.getElementById('chartTabs')) {
		const activeTab = document.querySelector('#chartTabs .tab-pane.active');
		if (activeTab) {
			const tabId = activeTab.id;
			console.log('当前激活的选项卡:', tabId);
			
			// 如果是类别统计选项卡，重新加载类别图表
			if (tabId === 'category-all-pane' || 
				tabId === 'category-yearly-pane' || 
				tabId === 'category-quarterly-pane' || 
				tabId === 'category-monthly-pane') {
				console.log('重新加载类别图表...');
				loadCategoryCharts();
			}
		}
	}
}

// 刷新图表
function refreshCharts() {
	loadChartData();
	showAlert('图表已刷新', 'success');
}

// 初始化搜索表单默认值
// 初始化搜索表单默认值
// 初始化搜索表单默认值
function initSearchFormDefaults() {
	console.log('初始化搜索表单默认值');
	
	const searchCategory = document.getElementById('searchCategory');
	const searchSubcategory = document.getElementById('searchSubcategory');
	
	// 确保有默认选项
	if (searchCategory.options.length === 1) { // 只有"全部"选项
		// 如果还没有加载类别，稍后加载
		setTimeout(() => {
			if (accountCategories.length > 0) {
				updateCategoryFilters();
			}
		}, 500);
	}
	
	// 设置所有搜索字段为默认值
	document.getElementById('searchAccountType').value = '全部';
	document.getElementById('searchCategory').value = '全部';
	document.getElementById('searchSubcategory').value = '全部';
	document.getElementById('searchStartDate').value = '';
	document.getElementById('searchEndDate').value = '';
	document.getElementById('searchAccountOwner').value = '全部';
	
	// 设置默认日期范围（最近一个月）
	const today = new Date();
	const oneMonthAgo = new Date();
	oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
	
	document.getElementById('searchStartDate').value = oneMonthAgo.toISOString().split('T')[0];
	document.getElementById('searchEndDate').value = today.toISOString().split('T')[0];
	
	// 确保清空搜索参数
	currentSearchParams = null;
}	

// 初始化类别统计图表容器
function initCategoryChartContainers() {
	const categoryTimeTabs = document.getElementById('categoryTimeTabsContent');
	if (!categoryTimeTabs) return;
	
	// 确保每个图表容器都有对应的canvas元素
	const chartIds = [
		'categoryDistributionChart',
		'incomeCategoryChart',
		'yearlyExpenseCategoryChart',
		'yearlyIncomeCategoryChart',
		'quarterlyExpenseCategoryChart',
		'quarterlyIncomeCategoryChart',
		'monthlyExpenseCategoryChart',
		'monthlyIncomeCategoryChart'
	];
	
	chartIds.forEach(chartId => {
		const element = document.getElementById(chartId);
		if (!element) {
			console.warn(`图表容器 ${chartId} 不存在，可能HTML结构有问题`);
		} else {
			// 确保canvas元素存在
			if (element.tagName !== 'CANVAS') {
				console.error(`元素 ${chartId} 不是canvas元素，而是 ${element.tagName}`);
			}
		}
	});
}

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
	setupPerformanceMonitoring();
	// 初始化类别统计图表容器
	setTimeout(initCategoryChartContainers, 1000);
	
	
	// 初始化全局变量
	accountRecords = [];
	accountCategories = [];
	selectedAccountRecords = new Set();
	currentAccountPage = 1;
	accountsPerPage = 20;
	totalAccountPages = 1;
	totalAccountRecords = 0;
	initSearchFormDefaults();
 // 测试API连接
	console.log('测试API连接...');
	fetch('/api/user_info')
		.then(response => {
			console.log('用户信息API状态:', response.status);
			if (!response.ok) {
				throw new Error(`API连接失败: ${response.status}`);
			}
			return response.json();
		})
		.then(data => {
			console.log('用户信息:', data);
		})
		.catch(error => {
			console.error('API连接测试失败:', error);
		});

	// 加载数据
	loadUserInfo();
	loadAccountRecords();
	loadAccountCategories();
	loadOwners();  // 这会自动更新所有下拉框
	//测试
	console.log('开始加载记账类别...');
	loadAccountCategories();
	
	console.log('开始加载所属人...');
	loadOwners();		

	// 添加模态框显示时的更新
	document.getElementById('accountRecordModal').addEventListener('show.bs.modal', function() {
		// 确保所属人下拉框是最新的
		setTimeout(() => {
			updateOwnerSelect('accountOwner', allOwners, null, allOwners[0] || '郭宁');
		}, 100);
	});
	
	document.getElementById('accountStatisticsModal').addEventListener('show.bs.modal', function() {
		// 确保统计模态框中的所属人下拉框是最新的
		setTimeout(() => {
			updateOwnerSelect('statisticsOwner', allOwners, '全部');
		}, 100);
	});

	// 事件监听
	document.getElementById('logoutBtn').addEventListener('click', logout);
	document.getElementById('changePasswordBtn').addEventListener('click', changePassword);
	document.getElementById('changeSecurityQuestionBtn').addEventListener('click', changeSecurityQuestion);
	document.getElementById('systemLogsBtn').addEventListener('click', openSystemLogsModal);
	document.getElementById('manageCategoriesBtn').addEventListener('click', openCategoriesModal);
	document.getElementById('addAccountRecordBtn').addEventListener('click', openAddAccountModal);
	document.getElementById('refreshAccountsBtn').addEventListener('click', loadAccountRecords);
	document.getElementById('deleteSelectedAccountsBtn').addEventListener('click', deleteSelectedAccountRecords);
	document.getElementById('accountStatisticsBtn').addEventListener('click', showAccountStatistics);
	document.getElementById('exportAccountDataBtn').addEventListener('click', exportAccountData);
	document.getElementById('importAccountDataBtn').addEventListener('click', importAccountData);
	document.getElementById('saveAccountRecordBtn').addEventListener('click', saveAccountRecord);
	document.getElementById('selectAllAccounts').addEventListener('change', toggleSelectAllAccounts);
	document.getElementById('accountPageJumpBtn').addEventListener('click', jumpToAccountPage);
	document.getElementById('accountRecordType').addEventListener('change', loadCategoryOptions);
	document.getElementById('savePasswordBtn').addEventListener('click', savePassword);
	document.getElementById('saveSecurityQuestionBtn').addEventListener('click', saveSecurityQuestion);
	document.getElementById('confirmImportBtn').addEventListener('click', confirmImportAccountData);
	//子类型金额总和统计
	document.getElementById('subcategoryStatisticsBtn').addEventListener('click', openSubcategoryStatisticsModal);
	document.getElementById('calculateSubcategoryBtn').addEventListener('click', calculateSubcategoryStatistics);
	document.getElementById('exportSubcategoryBtn').addEventListener('click', exportSubcategoryResults);
	//所属人管理相关事件监听
	document.getElementById('manageOwnersBtn').addEventListener('click', openOwnersManagementModal);
	document.getElementById('ownerDeepStatsBtn').addEventListener('click', openOwnerDeepStatisticsModal);
	document.getElementById('ownerComparisonBtn').addEventListener('click', openOwnerComparisonModal);

	// 动态调整表格高度
	function adjustTableHeight() {
		const tableContainer = document.querySelector('.table-container');
		if (!tableContainer) return;
		
		// 计算可用高度
		const viewportHeight = window.innerHeight;
		const header = document.querySelector('.navbar');
		const controlPanel = document.querySelector('.control-panel');
		const searchPanel = document.querySelector('.card.compact-card');
		const statsPanel = document.querySelector('.stats-row');
		const cardHeader = document.querySelector('.card-header.d-flex');
		const pagination = document.querySelector('.pagination-controls');
		
		let totalUsedHeight = 0;
		
		if (header) totalUsedHeight += header.offsetHeight;
		if (controlPanel) totalUsedHeight += controlPanel.offsetHeight;
		if (searchPanel) totalUsedHeight += searchPanel.offsetHeight;
		if (statsPanel) totalUsedHeight += statsPanel.offsetHeight;
		if (cardHeader) totalUsedHeight += cardHeader.offsetHeight;
		if (pagination) totalUsedHeight += pagination.offsetHeight;
		
		// 添加一些边距
		totalUsedHeight += 40;
		
		const availableHeight = viewportHeight - totalUsedHeight;
		
		// 设置表格容器高度
		if (availableHeight > 300) {
			tableContainer.style.height = availableHeight + 'px';
			tableContainer.style.minHeight = '300px';
		}
	}

	// 窗口大小改变时重新调整
	window.addEventListener('resize', adjustTableHeight);

	// 页面加载时调整
	setTimeout(adjustTableHeight, 100);
	setTimeout(adjustTableHeight, 500); // 延迟调整确保所有元素已渲染

	// ==================== 修改：每页显示数量改变事件 ====================
	document.getElementById('accountPageSizeSelect').addEventListener('change', function() {
		accountsPerPage = parseInt(this.value);
		currentAccountPage = 1; // 重置到第一页
		
		// 重新加载数据
		if (currentSearchParams) {
			// 如果有搜索条件，重新搜索
			searchAccountRecords(1);
		} else {
			// 没有搜索条件，正常加载
			loadAccountRecords(1);
		}
	});

	// 统计功能事件监听
	document.getElementById('statisticsFilterForm').addEventListener('submit', function(e) {
		e.preventDefault();
		loadDetailedStatistics();
	});
	document.getElementById('exportStatisticsBtn').addEventListener('click', exportStatistics);

	// 日历相关事件监听
	document.getElementById('calendarViewBtn').addEventListener('click', openCalendarModal);
	document.getElementById('refreshCalendarBtn').addEventListener('click', loadCalendarData);
	document.getElementById('prevMonthBtn').addEventListener('click', function() {
		const dateInput = document.getElementById('calendarMonth');
		const [year, month] = dateInput.value.split('-').map(Number);
		
		let prevYear = year;
		let prevMonth = month - 1;
		
		if (prevMonth < 1) {
			prevMonth = 12;
			prevYear = year - 1;
		}
		
		dateInput.value = `${prevYear}-${prevMonth.toString().padStart(2, '0')}`;
		loadCalendarData();
	});
	document.getElementById('nextMonthBtn').addEventListener('click', function() {
		const dateInput = document.getElementById('calendarMonth');
		const [year, month] = dateInput.value.split('-').map(Number);
		
		let nextYear = year;
		let nextMonth = month + 1;
		
		if (nextMonth > 12) {
			nextMonth = 1;
			nextYear = year + 1;
		}
		
		dateInput.value = `${nextYear}-${nextMonth.toString().padStart(2, '0')}`;
		loadCalendarData();
	});
	document.getElementById('calendarOwner').addEventListener('change', loadCalendarData);
	document.getElementById('calendarViewMode').addEventListener('change', function() {
		const viewMode = this.value;
		const dateInput = document.getElementById('calendarMonth').value;
		const [year, month] = dateInput.split('-').map(Number);
		const owner = document.getElementById('calendarOwner').value;
		
		// 重新渲染当前日历数据
		const params = new URLSearchParams({
			year: year,
			month: month,
			owner: owner
		});
		
		fetch(`/api/account/calendar?${params}`)
			.then(response => response.json())
			.then(data => {
				if (data.success) {
					renderCalendar(data, viewMode);
				}
			});
	});
	document.getElementById('exportCalendarBtn').addEventListener('click', exportCalendarData);


	// 修改搜索表单提交事件
	// 修改搜索表单提交事件
	document.getElementById('accountSearchForm').addEventListener('submit', function(e) {
		e.preventDefault();
		console.log('搜索表单提交');
		
		// 重置到第一页
		currentAccountPage = 1;
		
		// 执行搜索
		searchAccountRecords();
	});

	// 修改刷新按钮的事件处理
	document.getElementById('refreshAccountsBtn').addEventListener('click', function() {
		console.log('点击刷新按钮，当前搜索参数:', currentSearchParams);
		
		// 重置到第一页
		currentAccountPage = 1;
		
		// 如果有搜索参数，重新搜索，否则加载所有记录
		if (currentSearchParams && Object.keys(currentSearchParams).length > 0) {
			console.log('有搜索参数，执行搜索...');
			searchAccountRecords(1);
		} else {
			console.log('无搜索参数，加载所有记录...');
			currentSearchParams = null;
			loadAllAccountRecords(1);
		}
	});

	// 修改清空搜索按钮
	// 修改清空搜索按钮
	// 修改清空搜索按钮
	document.getElementById('clearAccountSearchBtn').addEventListener('click', function() {
		console.log('点击清空搜索按钮');
		
		// 重置搜索表单
		document.getElementById('accountSearchForm').reset();
		
		// 设置默认日期范围（最近一个月）
		const today = new Date();
		const oneMonthAgo = new Date();
		oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
		
		document.getElementById('searchStartDate').value = oneMonthAgo.toISOString().split('T')[0];
		document.getElementById('searchEndDate').value = today.toISOString().split('T')[0];
		
		// 清空搜索参数
		currentSearchParams = null;
		
		// 重置到第一页
		currentAccountPage = 1;
		
		// 重新加载所有数据
		loadAllAccountRecords(1);
		
		// 显示提示
		showAlert('搜索条件已清空，显示全部数据', 'success');
	});
	// 系统日志相关事件
	document.getElementById('logSearchForm').addEventListener('submit', function(e) {
		e.preventDefault();
		currentLogPage = 1;
		loadSystemLogs();
	});
	
	document.getElementById('clearLogSearchBtn').addEventListener('click', function() {
		document.getElementById('logSearchForm').reset();
		currentLogPage = 1;
		loadSystemLogs();
	});
	
	document.getElementById('logPageJumpBtn').addEventListener('click', jumpToLogPage);
	document.getElementById('exportLogsBtn').addEventListener('click', exportSystemLogs);
	
	document.getElementById('exportOwnerStatsBtn').addEventListener('click', exportOwnerDeepStatistics);
	document.getElementById('exportOwnerCompareBtn').addEventListener('click', exportOwnerComparisonStatistics);
	
	// 类别保存管理相关事件
	document.getElementById('saveCategoriesBtn').addEventListener('click', saveCategories);

	// 图表相关事件
	document.querySelectorAll('.chart-type-btn').forEach(btn => {
		btn.addEventListener('click', function() {
			switchChartType(this.getAttribute('data-chart-type'));
		});
	});

	document.getElementById('refreshChartsBtn').addEventListener('click', refreshCharts);
			
	// 在 DOMContentLoaded 中添加
	document.getElementById('searchCategory').addEventListener('change', function() {
		updateSubcategoryOptions();
	});



	// 类别统计时间维度切换事件
	// 类别统计时间维度切换事件
	// 修改类别统计时间维度切换事件处理
// 类别统计时间维度切换事件
document.querySelectorAll('#categoryTimeTabs .nav-link').forEach(btn => {
	btn.addEventListener('click', function() {
		console.log('切换类别时间维度按钮被点击:', this.id, this.textContent.trim());
		
		// 直接根据点击的按钮设置时间维度
		const btnId = this.id;
		if (btnId === 'category-all-tab') {
			currentCategoryTimeRange = 'all';
		} else if (btnId === 'category-yearly-tab') {
			currentCategoryTimeRange = 'yearly';
		} else if (btnId === 'category-quarterly-tab') {
			currentCategoryTimeRange = 'quarterly';
		} else if (btnId === 'category-monthly-tab') {
			currentCategoryTimeRange = 'monthly';
		}
		
		console.log('设置当前类别时间维度为:', currentCategoryTimeRange);
		
		// 延迟重新加载数据，确保选项卡切换完成
		setTimeout(() => {
			console.log('重新加载类别图表数据...');
			loadCategoryCharts();
		}, 300);
	});
});

	// 在DOMContentLoaded中调用加载所属人
	loadOwners();

	// 在统计表单提交事件中添加所有者筛选
	document.getElementById('ownerStatsStartDate').addEventListener('change', function() {
		document.getElementById('ownerStatsEndDate').min = this.value;
	});

	document.getElementById('ownerCompareStartDate').addEventListener('change', function() {
		document.getElementById('ownerCompareEndDate').min = this.value;
	});

	// 添加统计计算按钮事件
	document.getElementById('calculateOwnerStatsBtn').addEventListener('click', loadOwnerDeepStatistics);
	document.getElementById('calculateOwnerCompareBtn').addEventListener('click', loadOwnerComparisonStatistics);

	// 设置默认日期为今天
	const today = new Date().toISOString().split('T')[0];
	document.getElementById('accountDate').value = today;
	const oneMonthAgo = new Date();
	oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
	document.getElementById('subcategoryStartDate').value = oneMonthAgo.toISOString().split('T')[0];
	document.getElementById('subcategoryEndDate').value = today;
	
	// 设置统计默认日期范围（最近一年）
	const oneYearAgo = new Date();
	oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
	document.getElementById('statisticsStartDate').value = oneYearAgo.toISOString().split('T')[0];
	document.getElementById('statisticsEndDate').value = today;
});